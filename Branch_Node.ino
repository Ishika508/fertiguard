#include <WiFi.h>
#include <esp_now.h>

/* ================= WIFI ================= */
#define WIFI_SSID "Arpit"
#define WIFI_PASS "1234567890"

/* ================= FLOW SENSOR ================= */
#define FLOW_SENSOR_PIN 15

volatile uint32_t pulseCount = 0;

/* ================= NODE CONFIG ================= */
#define NODE_ID 1   // 🔥 CHANGE: 1,2,3...

/* ================= PRIMARY MAC ================= */
uint8_t primaryAddress[] = {0xD4, 0x8A, 0xFC, 0xCF, 0xEE, 0x70};

/* ================= DATA STRUCT ================= */
typedef struct {
  int nodeType;   // 1 = branch
  int nodeID;
  float flow;
} BranchPacket;

BranchPacket dataToSend;

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

/* ================= SETUP ================= */
void setup() {

  Serial.begin(115200);

  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN),
                  flowISR,
                  RISING);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  Serial.println("\nBranch Node Connected to WiFi");

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW Init Failed");
    return;
  }

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, primaryAddress, 6);
  peerInfo.channel = WiFi.channel();
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  Serial.println("Branch Node Ready");
}

/* ================= LOOP ================= */
void loop() {

  float flow = readFlow();

  // Optional debug (safe, does NOT affect CSV)
  Serial.print("B"); 
  Serial.print(NODE_ID);
  Serial.print(" Flow: ");
  Serial.println(flow);

  dataToSend.nodeType = 1;
  dataToSend.nodeID   = NODE_ID;
  dataToSend.flow     = flow;

  esp_err_t result = esp_now_send(primaryAddress,
                                 (uint8_t*)&dataToSend,
                                 sizeof(dataToSend));

  if (result != ESP_OK) {
    Serial.println("Send Error");
  }

  delay(3000);   // 🔥 avoid packet collision
}