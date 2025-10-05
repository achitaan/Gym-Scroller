// #include <Arduino.h>
// #include <Wire.h>
// #include <Adafruit_MPU6050.h>

// Adafruit_MPU6050 mpu;

// void setup() {
//   Serial.begin(9600);
// }

// void loop() {
//   // put your main code here, to run repeatedly:
//   sensors_event_t a, g, temp;
//   mpu.getEvent(&a, &g, &temp);

//   Serial.print("Acceleration X: ");
//   Serial.print(a.acceleration.x);
//   Serial.print(" || Y: ");
//   Serial.print(a.acceleration.y);
//   Serial.print(" || Z: ");
//   Serial.print(a.acceleration.z);

//   Serial.print("Gyroscope X: ");
//   Serial.print(g.gyro.x);
//   Serial.print(" || Y: ");
//   Serial.print(g.gyro.y);
//   Serial.print(" || Z: ");
//   Serial.print(g.gyro.z);

//   Serial.println("");
//   delay(100);
// }

// #define LED D1

// void setup() {
//   pinMode(LED, OUTPUT);
// }

// void loop() {
//   digitalWrite(LED, HIGH);
//   delay(200);
//   digitalWrite(LED, LOW);
//   delay(200);
// }

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <Wire.h>

// WiFi Access Point credentials
const char* AP_SSID = "GymScroller-MPU6050";
const char* AP_PASSWORD = "gymscroller123";

// WebSocket server settings (laptop will connect to this AP and run backend on
// its own IP) Default: connect to gateway IP (192.168.4.1 is ESP8266 AP
// default, but laptop will be 192.168.4.2)
const char* wsHost = "192.168.4.2";
// Laptop's IP when connected to ESP8266 AP
const uint16_t wsPort = 3001;
const char* wsPath = "/socket.io/?EIO=4&transport=websocket";

Adafruit_MPU6050 mpu;
WebSocketsClient webSocket;

// Rep detection state machine
enum RepPhase { WAITING, CONCENTRIC, ECCENTRIC };

const char* phaseNames[] = {"WAITING", "CONCENTRIC", "ECCENTRIC"};

RepPhase currentPhase = WAITING;
RepPhase lastPhase = WAITING;  // Track previous phase to detect changes
float lastGyroZ = 0.0;
bool concentricIsPositive = true;  // Set on first significant movement
int repCount = 0;
const float DIRECTION_THRESHOLD =
    1.5;  // rad/s threshold to detect direction change (angular velocity)

// Failure detection based on concentric phase timing
const int MAX_DURATION_HISTORY = 10;  // Track last 10 reps
unsigned long concentricDurations[MAX_DURATION_HISTORY] = {0};
int durationIndex = 0;
int durationsRecorded = 0;
unsigned long concentricStartTime = 0;
float medianConcentricDuration = 0;
const float FAILURE_THRESHOLD_MULTIPLIER = 1.5;  // 2x median = failure
bool failureDetected = false;
bool lastFailureState =
    false;  // Track previous failure state to detect changes

// Helper function to calculate median
float calculateMedian(unsigned long* values, int count) {
    // Create a copy for sorting
    unsigned long sorted[MAX_DURATION_HISTORY];
    for (int i = 0; i < count; i++) {
        sorted[i] = values[i];
    }

    // Simple bubble sort
    for (int i = 0; i < count - 1; i++) {
        for (int j = 0; j < count - i - 1; j++) {
            if (sorted[j] > sorted[j + 1]) {
                unsigned long temp = sorted[j];
                sorted[j] = sorted[j + 1];
                sorted[j + 1] = temp;
            }
        }
    }

    // Return median
    if (count % 2 == 0) {
        return (sorted[count / 2 - 1] + sorted[count / 2]) / 2.0;
    } else {
        return sorted[count / 2];
    }
}

bool wsConnected = false;
bool socketIOConnected = false;

// WebSocket reconnection safety
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL =
    5000;  // Try reconnecting every 5 seconds
unsigned long lastPingTime = 0;
const unsigned long PING_INTERVAL =
    10000;  // Send keepalive ping every 10 seconds
unsigned long connectionStartTime = 0;
int reconnectAttempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 10;  // After 10 failures, increase interval

// Accelerometer calibration variables
bool isCalibrating = true;
unsigned long calibrationStartTime = 0;
int calibrationSamples = 0;
float accelSumX = 0, accelSumY = 0, accelSumZ = 0;
float accelOffsetX = 0, accelOffsetY = 0, accelOffsetZ = 0;
const float ACCEL_ZERO_TOLERANCE =
    0.5;  // m/s² - values within this range treated as 0

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.println("[WS] ❌ Disconnected - will attempt reconnection");
            wsConnected = false;
            socketIOConnected = false;
            lastReconnectAttempt = millis();  // Start reconnection timer
            break;
        case WStype_CONNECTED:
            Serial.println("[WS] ✅ WebSocket Connected");
            wsConnected = true;
            connectionStartTime = millis();
            reconnectAttempts = 0;  // Reset reconnection counter on success
            // Send Socket.IO connect packet (40 = connect to default namespace)
            webSocket.sendTXT("40");
            Serial.println("[SocketIO] Sent connect packet (40)");
            break;
        case WStype_TEXT: {
            Serial.printf("[WS] Message: %s\n", payload);
            // Check if this is Socket.IO connection confirmation
            String msg = String((char*)payload);
            if (msg.startsWith("40")) {
                // Socket.IO connected successfully
                socketIOConnected = true;
                Serial.println(
                    "[SocketIO] ✅ Connected and ready to send data");
            } else if (msg.startsWith("0")) {
                // Socket.IO protocol messages (ping/pong, etc.)
                Serial.printf("[SocketIO] Protocol: %s\n", payload);
            } else if (msg.startsWith("3")) {
                // Pong response from server
                Serial.println("[SocketIO] 💓 Pong received");
            }
            break;
        }
        case WStype_ERROR:
            Serial.printf("[WS] ⚠️ Error: %s\n", payload);
            break;
        case WStype_PING:
            Serial.println("[WS] Ping received");
            break;
        case WStype_PONG:
            Serial.println("[WS] 💓 Pong received");
            break;
    }
}

void setup() {
    Serial.begin(9600);

    // Setup WiFi Access Point
    Serial.println("Setting up WiFi AP...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);

    IPAddress IP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(IP);
    Serial.printf("Connect your laptop to '%s' and run backend on %s:%d\n",
                  AP_SSID, wsHost, wsPort);

    // Setup MPU6050
    if (!mpu.begin()) {
        Serial.println("Failed to find MPU6050 chip");
        while (1) {
            delay(10);
        }
    }
    mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
    mpu.setGyroRange(MPU6050_RANGE_250_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("MPU6050 Ready");

    // Start accelerometer calibration
    calibrationStartTime = millis();
    Serial.println(
        "Calibrating accelerometer - keep device stationary for 2 seconds...");

    // Setup WebSocket with connection safety features
    webSocket.begin(wsHost, wsPort, wsPath);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);  // Auto-reconnect every 5 seconds
    webSocket.enableHeartbeat(
        15000, 3000,
        2);  // Ping every 15s, timeout 3s, 2 disconnects to trigger reconnect
    Serial.println("[WS] WebSocket initialized with heartbeat monitoring");
}

void loop() {
    webSocket.loop();  // Handle WebSocket events

    // Manual reconnection logic if auto-reconnect fails
    if (!wsConnected) {
        unsigned long now = millis();
        unsigned long interval = RECONNECT_INTERVAL;

        // Increase interval after many failed attempts to avoid spam
        if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            interval = 30000;  // Wait 30 seconds after 10 failures
        }

        if (now - lastReconnectAttempt > interval) {
            lastReconnectAttempt = now;
            reconnectAttempts++;
            Serial.printf("[WS] 🔄 Manual reconnection attempt #%d\n",
                          reconnectAttempts);
            webSocket.disconnect();
            delay(100);
            webSocket.begin(wsHost, wsPort, wsPath);
        }
    }

    // Send periodic keepalive pings when connected
    if (socketIOConnected) {
        unsigned long now = millis();
        if (now - lastPingTime > PING_INTERVAL) {
            lastPingTime = now;
            webSocket.sendTXT("2");  // Socket.IO ping packet
            Serial.println("[SocketIO] 💓 Sending ping");
        }
    }

    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Handle accelerometer calibration phase
    if (isCalibrating) {
        unsigned long elapsed = millis() - calibrationStartTime;

        if (elapsed < 2000) {  // Calibrate for 2 seconds
            // Accumulate samples
            accelSumX += a.acceleration.x;
            accelSumY += a.acceleration.y;
            accelSumZ += a.acceleration.z;
            calibrationSamples++;
            delay(20);  // Sample at ~50Hz
            return;     // Skip rest of loop during calibration
        } else {
            // Calibration complete - calculate offsets
            accelOffsetX = accelSumX / calibrationSamples;
            accelOffsetY = accelSumY / calibrationSamples;
            accelOffsetZ = accelSumZ / calibrationSamples;
            isCalibrating = false;

            Serial.println("Calibration complete!");
            Serial.print("Offsets - X: ");
            Serial.print(accelOffsetX);
            Serial.print(", Y: ");
            Serial.print(accelOffsetY);
            Serial.print(", Z: ");
            Serial.println(accelOffsetZ);
        }
    }

    // Apply calibration offsets to remove gravity
    float calibratedAccelX = a.acceleration.x - accelOffsetX;
    float calibratedAccelY = a.acceleration.y - accelOffsetY;
    float calibratedAccelZ = a.acceleration.z - accelOffsetZ;

    // Apply zero tolerance - treat small values as 0 (noise reduction)
    if (abs(calibratedAccelX) < ACCEL_ZERO_TOLERANCE) calibratedAccelX = 0;
    if (abs(calibratedAccelY) < ACCEL_ZERO_TOLERANCE) calibratedAccelY = 0;
    if (abs(calibratedAccelZ) < ACCEL_ZERO_TOLERANCE) calibratedAccelZ = 0;

    // ========================================================================
    // DIRECTION-CHANGE REP DETECTION (Using Gyroscope)
    // ========================================================================

    float currentGyroZ = g.gyro.z;  // Angular velocity on Z-axis (rad/s)

    // State machine logic
    if (currentPhase == WAITING) {
        // Wait for first significant rotation - establishes concentric
        // direction
        if (abs(currentGyroZ) > DIRECTION_THRESHOLD) {
            concentricIsPositive = (currentGyroZ > 0);
            currentPhase = CONCENTRIC;
            concentricStartTime = millis();  // Start timing concentric phase
            failureDetected = false;         // Reset failure flag
            Serial.print("🏋️  Starting rep - CONCENTRIC phase (");
            Serial.print(concentricIsPositive ? "positive" : "negative");
            Serial.println(" rotation)");
        }
    } else if (currentPhase == CONCENTRIC) {
        // Check for failure: concentric taking too long
        unsigned long concentricElapsed = millis() - concentricStartTime;

        if (durationsRecorded >= 3 && medianConcentricDuration > 0) {
            if (concentricElapsed >
                medianConcentricDuration * FAILURE_THRESHOLD_MULTIPLIER) {
                if (!failureDetected) {
                    failureDetected = true;
                    Serial.print("⚠️  FAILURE DETECTED - Concentric phase ");
                    Serial.print(concentricElapsed);
                    Serial.print("ms (");
                    Serial.print(concentricElapsed / medianConcentricDuration);
                    Serial.println("x median)");
                }
            }
        }

        // Check for direction reversal to eccentric phase
        bool reversedDirection = concentricIsPositive
                                     ? (currentGyroZ < -DIRECTION_THRESHOLD)
                                     : (currentGyroZ > DIRECTION_THRESHOLD);

        if (reversedDirection) {
            // Record concentric duration
            unsigned long duration = millis() - concentricStartTime;
            concentricDurations[durationIndex] = duration;
            durationIndex = (durationIndex + 1) % MAX_DURATION_HISTORY;
            if (durationsRecorded < MAX_DURATION_HISTORY) {
                durationsRecorded++;
            }

            // Calculate median
            medianConcentricDuration =
                calculateMedian(concentricDurations, durationsRecorded);

            currentPhase = ECCENTRIC;
            failureDetected =
                false;  // Clear failure flag when transitioning to eccentric
            Serial.print("⬇️  ECCENTRIC phase (concentric took ");
            Serial.print(duration);
            Serial.print("ms, median: ");
            Serial.print(medianConcentricDuration);
            Serial.println("ms)");
        }
    } else if (currentPhase == ECCENTRIC) {
        // Check for return to concentric direction = REP COMPLETE
        bool returnedToConcentric = concentricIsPositive
                                        ? (currentGyroZ > DIRECTION_THRESHOLD)
                                        : (currentGyroZ < -DIRECTION_THRESHOLD);

        if (returnedToConcentric) {
            currentPhase = CONCENTRIC;
            concentricStartTime = millis();  // Start new concentric timer
            failureDetected = false;         // Reset failure flag for new rep
            repCount++;
            Serial.print("✅ REP #");
            Serial.print(repCount);
            Serial.println(" COMPLETED");
        }
    }

    lastGyroZ = currentGyroZ;

    // Send state via WebSocket ONLY when phase OR failure state changes
    bool stateChanged =
        (currentPhase != lastPhase) || (failureDetected != lastFailureState);

    if (socketIOConnected && stateChanged) {
        // Determine which message to send (use const char* to avoid String
        // allocation)
        const char* socketIOMsg;
        if (failureDetected) {
            socketIOMsg = "42[\"sensorData\",\"failure\"]";
        } else if (currentPhase == CONCENTRIC) {
            socketIOMsg = "42[\"sensorData\",\"concentric\"]";
        } else if (currentPhase == ECCENTRIC) {
            socketIOMsg = "42[\"sensorData\",\"eccentric\"]";
        } else {
            socketIOMsg = "42[\"sensorData\",\"waiting\"]";
        }
        webSocket.sendTXT(socketIOMsg);

        // Update last states after sending
        lastPhase = currentPhase;
        lastFailureState = failureDetected;
    }

    delay(20);  // ~50Hz sampling
}
