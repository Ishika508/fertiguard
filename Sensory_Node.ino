#include <WiFi.h>
#include <esp_now.h>

/* ================= WIFI ================= */
#define WIFI_SSID "Arpit"
#define WIFI_PASS "1234567890"

/* ================= RELAY LOGIC (ACTIVE LOW) ================= */
#define RELAY_ON  LOW
#define RELAY_OFF HIGH

/* ================= PINS ================= */
#define SOL_MAIN        26
#define SOL_TANK_IN     27
#define MOTOR_TANK_OUT  32
#define FLOW_SENSOR_PIN 33
#define PH_SENSOR_PIN   35
#define TURBIDITY_PIN   34

/* ================= TIMING VARIABLES ================= */

const unsigned long MOTOR_ON_TIME   = 8000;   // motor ON duration (ms)
const unsigned long NORMAL_MODE_TIME = 60000; // NORMAL mode duration
const unsigned long SAMPLING_TIME    = 20000; // sampling duration

float m = -4.785;
float c = 14.45;

volatile uint32_t pulseCount = 0;

/* ================= STATES ================= */

enum Mode {
  SAMPLING,
  NORMAL_FLOW,
  CLEARING
};

Mode currentMode = SAMPLING;

unsigned long stateStartTime = 0;
unsigned long normalStartTime = 0;
unsigned long motorStartTime = 0;

bool motorRunning = false;

/* ================= PRIMARY MAC ================= */

uint8_t primaryAddress[] = {0xD4, 0x8A, 0xFC, 0xCF, 0xEE, 0x70};

typedef struct {
  float pH;
  float turbidity;
  float endFlow;
  int mode;
} SensorPacket;

typedef struct {
  int newMode;
} CommandPacket;

SensorPacket dataToSend;
CommandPacket incomingCommand;

/* ================= FLOW ISR ================= */

void IRAM_ATTR flowISR() {
  pulseCount++;
}

/* ================= FLOW READ ================= */

float readFlow() {

  detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));

  float flow = (pulseCount / 450.0) * 60.0;

  pulseCount = 0;

  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN),
                  flowISR,
                  RISING);

  return flow;
}

/* ================= PH READ ================= */

float readPH() {

  long sum = 0;

  for(int i=0;i<20;i++){
    sum += analogRead(PH_SENSOR_PIN);
    delay(5);
  }

  float voltage = (sum/20.0)*(3.3/4095.0);

  return m*voltage + c;
}

/* ================= TURBIDITY READ ================= */

float readTurbidity(){

  long sum=0;

  for(int i=0;i<20;i++){
    sum += analogRead(TURBIDITY_PIN);
    delay(5);
  }

  return (sum/20.0)*(3.3/4095.0);
}

/* ================= PRINT ACTUATOR STATUS ================= */

void printActuatorStatus() {

  Serial.println("---- POWER STATUS ----");

  Serial.print("Main Solenoid: ");
  Serial.println(digitalRead(SOL_MAIN) == RELAY_ON ? "ON" : "OFF");

  Serial.print("Tank IN Solenoid: ");
  Serial.println(digitalRead(SOL_TANK_IN) == RELAY_ON ? "ON" : "OFF");

  Serial.print("Tank OUT Motor: ");
  Serial.println(digitalRead(MOTOR_TANK_OUT) == RELAY_ON ? "ON" : "OFF");

  Serial.println("----------------------");
}

/* ================= RECEIVE COMMAND ================= */

void OnDataRecv(const esp_now_recv_info_t *info,
                const uint8_t *data,
                int len){

  memcpy(&incomingCommand, data, sizeof(incomingCommand));

  if(incomingCommand.newMode == CLEARING){

      currentMode = CLEARING;

      Serial.println(">>> CLEARING MODE ACTIVATED <<<");
  }

  if(incomingCommand.newMode == SAMPLING){

      currentMode = SAMPLING;

      stateStartTime = millis();

      Serial.println(">>> SAMPLING MODE ACTIVATED <<<");
  }
}

/* ================= SETUP ================= */

void setup(){

  Serial.begin(115200);

  pinMode(SOL_MAIN,OUTPUT);
  pinMode(SOL_TANK_IN,OUTPUT);
  pinMode(MOTOR_TANK_OUT,OUTPUT);

  digitalWrite(SOL_MAIN, RELAY_OFF);
  digitalWrite(SOL_TANK_IN, RELAY_OFF);
  digitalWrite(MOTOR_TANK_OUT, RELAY_OFF);

  pinMode(FLOW_SENSOR_PIN,INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN),
                  flowISR,
                  RISING);

  WiFi.mode(WIFI_STA);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) delay(500);

  esp_now_init();

  esp_now_peer_info_t peerInfo = {};

  memcpy(peerInfo.peer_addr, primaryAddress, 6);

  peerInfo.channel = WiFi.channel();

  peerInfo.encrypt = false;

  esp_now_add_peer(&peerInfo);

  esp_now_register_recv_cb(OnDataRecv);

  stateStartTime = millis();

  Serial.println("SENSORY NODE STARTED → SAMPLING");
}

/* ================= LOOP ================= */

void loop(){

  unsigned long now = millis();

  /* ================= CLEARING MODE ================= */

  if(currentMode == CLEARING){

      digitalWrite(SOL_TANK_IN, RELAY_OFF);
      digitalWrite(MOTOR_TANK_OUT, RELAY_OFF);
      digitalWrite(SOL_MAIN, RELAY_ON);

      printActuatorStatus();

      delay(500);

      return;
  }

  /* ================= SAMPLING MODE ================= */

  if(currentMode == SAMPLING){

      digitalWrite(SOL_MAIN, RELAY_OFF);
      digitalWrite(SOL_TANK_IN, RELAY_ON);
      digitalWrite(MOTOR_TANK_OUT, RELAY_OFF);

      if(now - stateStartTime > SAMPLING_TIME){

          currentMode = NORMAL_FLOW;

          normalStartTime = millis();
          motorStartTime = millis();
          motorRunning = true;

          Serial.println("Switching to NORMAL FLOW");
      }
  }

  /* ================= NORMAL MODE ================= */

  if(currentMode == NORMAL_FLOW){

      digitalWrite(SOL_TANK_IN, RELAY_OFF);
      digitalWrite(SOL_MAIN, RELAY_ON);

      if(motorRunning){

          digitalWrite(MOTOR_TANK_OUT, RELAY_ON);

          if(millis() - motorStartTime >= MOTOR_ON_TIME){

              digitalWrite(MOTOR_TANK_OUT, RELAY_OFF);

              motorRunning = false;

              Serial.println("Tank emptied → Motor OFF");
          }
      }

      if(millis() - normalStartTime >= NORMAL_MODE_TIME){

          currentMode = SAMPLING;

          stateStartTime = millis();

          Serial.println("NORMAL MODE COMPLETE → Returning to SAMPLING");
      }
  }

  /* ================= SENSOR READ ================= */

  float flow = readFlow();
  float pH   = readPH();
  float turb = readTurbidity();

  Serial.println("\n--- SENSOR DATA ---");

  Serial.print("Mode: "); Serial.println(currentMode);
  Serial.print("pH: "); Serial.println(pH);
  Serial.print("Turbidity: "); Serial.println(turb);
  Serial.print("End Flow: "); Serial.println(flow);

  printActuatorStatus();

  /* ================= SEND DATA ================= */

  dataToSend.pH        = pH;
  dataToSend.turbidity = turb;
  dataToSend.endFlow   = flow;
  dataToSend.mode      = currentMode;

  esp_now_send(primaryAddress,
               (uint8_t*)&dataToSend,
               sizeof(dataToSend));

  delay(2000);
}