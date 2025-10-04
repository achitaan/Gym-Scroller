#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  Serial.print("Acceleration X: ");
  Serial.print(a.acceleration.x);
  Serial.print(" || Y: ");
  Serial.print(a.acceleration.y);
  Serial.print(" || Z: ");
  Serial.print(a.acceleration.z);

  Serial.print("Gyroscope X: ");
  Serial.print(g.gyro.x);
  Serial.print(" || Y: ");
  Serial.print(g.gyro.y);
  Serial.print(" || Z: ");
  Serial.print(g.gyro.z);

  Serial.println("");
  delay(100);
}

// #define LED D0

// void setup() {
//   pinMode(LED, OUTPUT);
// }

// void loop() {
//   digitalWrite(LED, HIGH);
//   delay(200);
//   digitalWrite(LED, LOW);
// }