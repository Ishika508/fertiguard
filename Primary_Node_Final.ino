#define AIN1 3
#define AIN2 4
#define BIN1 5
#define BIN2 6
#define PWMA 11
#define PWMB 10
#define STBY 7

#define TRIG 9
#define ECHO 8

void setup() {
  Serial.begin(9600);

  pinMode(AIN1, OUTPUT);
  pinMode(AIN2, OUTPUT);
  pinMode(BIN1, OUTPUT);
  pinMode(BIN2, OUTPUT);
  pinMode(PWMA, OUTPUT);
  pinMode(PWMB, OUTPUT);
  pinMode(STBY, OUTPUT);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  digitalWrite(STBY, HIGH);
}

long getDistance() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  return pulseIn(ECHO, HIGH);
}

void loop() {

  long duration = getDistance();
  float distance = duration * 0.034 / 2;

  Serial.println(distance);

  // move forward
  digitalWrite(AIN1, HIGH);
  digitalWrite(AIN2, LOW);
  analogWrite(PWMA, 120);

  digitalWrite(BIN1, HIGH);
  digitalWrite(BIN2, LOW);
  analogWrite(PWMB, 120);

  delay(100);
}