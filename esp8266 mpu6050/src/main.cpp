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

float baselineSpeed = 0;  // average motion speed baseline
int repCount = 0;         // number of reps seen
bool calibrated = false;

unsigned long lastRepTime = 0;
bool inMotion = false;
bool wsConnected = false;
bool socketIOConnected = false;

// Accelerometer calibration variables
bool isCalibrating = true;
unsigned long calibrationStartTime = 0;
int calibrationSamples = 0;
float accelSumX = 0, accelSumY = 0, accelSumZ = 0;
float accelOffsetX = 0, accelOffsetY = 0, accelOffsetZ = 0;
const float ACCEL_ZERO_TOLERANCE = 0.5;  // m/s² - values within this range treated as 0

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.println("[WS] Disconnected");
            wsConnected = false;
            socketIOConnected = false;
            break;
        case WStype_CONNECTED:
            Serial.println("[WS] WebSocket Connected");
            wsConnected = true;
            // Send Socket.IO connect packet (40 = connect to default namespace)
            webSocket.sendTXT("40");
            Serial.println("[SocketIO] Sent connect packet (40)");
            break;
        case WStype_TEXT:
            Serial.printf("[WS] Message: %s\n", payload);
            // Check if this is Socket.IO connection confirmation
            String msg = String((char*)payload);
            if (msg.startsWith("40")) {
                // Socket.IO connected successfully
                socketIOConnected = true;
                Serial.println("[SocketIO] Connected and ready to send data");
            } else if (msg.startsWith("0")) {
                // Socket.IO protocol messages (ping/pong, etc.)
                Serial.printf("[SocketIO] Protocol: %s\n", payload);
            }
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
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("MPU6050 Ready");

    // Start accelerometer calibration
    calibrationStartTime = millis();
    Serial.println("Calibrating accelerometer - keep device stationary for 2 seconds...");

    // Setup WebSocket
    webSocket.begin(wsHost, wsPort, wsPath);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
}

void loop() {
    webSocket.loop();  // Handle WebSocket events

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
            return;  // Skip rest of loop during calibration
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

    // Calculate overall motion magnitude using calibrated values
    float accelMag = sqrt(calibratedAccelX * calibratedAccelX +
                          calibratedAccelY * calibratedAccelY +
                          calibratedAccelZ * calibratedAccelZ);

    float gyroMag =
        sqrt(g.gyro.x * g.gyro.x + g.gyro.y * g.gyro.y + g.gyro.z * g.gyro.z);

    float motionScore = accelMag + gyroMag;  // simple combined metric

    // Detect if user is moving enough to count as a rep
    float motionThreshold = 15.0;  // adjust experimentally
    if (motionScore > motionThreshold && !inMotion) {
        inMotion = true;
        lastRepTime = millis();
    }

    // When motion drops back below threshold → rep ends
    if (motionScore < motionThreshold && inMotion) {
        inMotion = false;
        unsigned long repDuration = millis() - lastRepTime;
        repCount++;

        if (!calibrated) {
            // Average first 2 reps to set baseline
            if (repCount <= 2) {
                baselineSpeed += repDuration;
                if (repCount == 2) {
                    baselineSpeed /= 2.0;
                    calibrated = true;
                    Serial.print("Calibrated baseline rep duration: ");
                    Serial.println(baselineSpeed);
                }
            }
        } else {
            // Compare current rep to baseline
            float slowFactor = repDuration / baselineSpeed;
            if (slowFactor > 1.5) {
                Serial.println("⚠️  SLOWING DOWN!");
            } else if (slowFactor > 1.2) {
                Serial.println("Noticeable Slowdown...");
            } else {
                Serial.println("Rep OK");
            }
        }
    }

    // Build JSON payload for rep event (using calibrated values)
    String repJson = "";
    repJson += "{\"accel\":{\"x\":";
    repJson += calibratedAccelX;
    repJson += ",\"y\":";
    repJson += calibratedAccelY;
    repJson += ",\"z\":";
    repJson += calibratedAccelZ;
    repJson += "},\"gyro\":{\"x\":";
    repJson += g.gyro.x;
    repJson += ",\"y\":";
    repJson += g.gyro.y;
    repJson += ",\"z\":";
    repJson += g.gyro.z;
    repJson += "}}";

    // Also log to Serial
    Serial.println(repJson);

    // Send via WebSocket if Socket.IO is fully connected
    if (socketIOConnected) {
        // Socket.IO format: 42["eventName", data]
        String socketIOMsg = "42[\"sensorData\",";
        socketIOMsg += repJson;
        socketIOMsg += "]";
        webSocket.sendTXT(socketIOMsg);
    }

    delay(20);  // ~50Hz sampling
}
