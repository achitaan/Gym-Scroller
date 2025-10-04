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


#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

Adafruit_MPU6050 mpu;

float baselineSpeed = 0;     // average motion speed baseline
int repCount = 0;            // number of reps seen
bool calibrated = false;

unsigned long lastRepTime = 0;
bool inMotion = false;

void setup() {
  Serial.begin(9600);
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
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Calculate overall motion magnitude
  float accelMag = sqrt(a.acceleration.x * a.acceleration.x +
                        a.acceleration.y * a.acceleration.y +
                        a.acceleration.z * a.acceleration.z);

  float gyroMag = sqrt(g.gyro.x * g.gyro.x +
                       g.gyro.y * g.gyro.y +
                       g.gyro.z * g.gyro.z);

  float motionScore = accelMag + gyroMag; // simple combined metric

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

    Serial.print("Rep detected. Duration: ");
    Serial.println(repDuration);

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

  delay(20); // ~50Hz sampling
}
