#include <M5Unified.h>

#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>


char *wifiSSID="untruths";
char *wifiPass="posttruth";
String websocketServerAdress="192.168.8.209";//208 on original
// String macString;
char macStr[5]; // 2+2 characters + null terminator

String codeBase="M5StickS3IMUWebsockets26";
String codeVersion="v0.05 @crispysmokedweb 1/10/2026";

WiFiMulti WiFiMulti;
WebSocketsClient webSocket;

float accX = 0.0F;
float accY = 0.0F;
float accZ = 0.0F;

float gyroX = 0.0F;
float gyroY = 0.0F;
float gyroZ = 0.0F;

float pitchNow=0.0F;
float pitchNowDeg=0.0F;
float rollNow=0.0F;
float rollNowDeg=0.0F;

float accThreshold = 3.0F;
bool displayIsOn=true;
unsigned long showDisplayFor=10*1000;//ms
unsigned long displayLastShown=0;
unsigned long now;
unsigned long heartbeatInterval=5000; //5 seconds
unsigned long lastHeartbeat=0;

bool sendAttitudeEnabled=true;
float attitudeChangeThreshold=0.75F;//3.0F;
char attitudeBuffer[5];
    

boolean connected=false;
byte mac[6];                     // the MAC address of your Wifi shield
int myID = -1;
String myIDs = "--";

#define USE_SERIAL Serial

void hexdump(const void *mem, uint32_t len, uint8_t cols = 16) {
  const uint8_t* src = (const uint8_t*) mem;
  USE_SERIAL.printf("\n[HEXDUMP] Address: 0x%08X len: 0x%X (%d)", (ptrdiff_t)src, len, len);
  for(uint32_t i = 0; i < len; i++) {
    if(i % cols == 0) {
      USE_SERIAL.printf("\n[0x%08X] 0x%08X: ", (ptrdiff_t)src, i);
    }
    USE_SERIAL.printf("%02X ", *src);
    src++;
  }
  USE_SERIAL.printf("\n");
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {

  switch(type) {
    case WStype_DISCONNECTED:
      USE_SERIAL.printf("[WSc] Disconnected!\n");
      connected=false;
      myIDs = "--";
      updateM5();
      break;
    case WStype_CONNECTED:
      USE_SERIAL.printf("[WSc] Connected to url: %s\n", payload);
      connected=true;
      // send message to server when Connected
      webSocket.sendTXT("Connected");
      webSocket.sendTXT(macStr);
      updateM5();
      break;
    case WStype_TEXT:
      USE_SERIAL.printf("[WSc] get text: %s\n", payload);
      checkForID((char*)payload);
      checkForAth((char*)payload);
      // send message to server
      // webSocket.sendTXT("message here");
      break;
    case WStype_BIN:
      USE_SERIAL.printf("[WSc] get binary length: %u\n", length);
      hexdump(payload, length);

      // send data to server
      // webSocket.sendBIN(payload, length);
      break;
    case WStype_ERROR:      
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      break;
  }

}

void setup(void)
{
    M5.begin();
      USE_SERIAL.begin(115200);
  delay(200);
  //Serial.setDebugOutput(true);
  USE_SERIAL.setDebugOutput(true);
  delay(200);
  USE_SERIAL.println();
  USE_SERIAL.println();
  USE_SERIAL.println(codeBase);
  USE_SERIAL.println(codeVersion);
  USE_SERIAL.println();

  for(uint8_t t = 4; t > 0; t--) {
    USE_SERIAL.printf("[SETUP] BOOT WAIT %d...\n", t);
    USE_SERIAL.flush();
    delay(1000);
  }
  M5.Lcd.setRotation(3);
  M5.Lcd.setTextColor(0x00, 0x51d);
  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setTextSize(1);
  M5.Lcd.setCursor(0, 0);
  M5.Lcd.println("Silvia sounds 2026");
  M5.Lcd.setCursor(0, 10);
  M5.Lcd.setTextColor(0xFF, 0x00);
  M5.Lcd.println("Waiting for WiFi ...");
  // WiFiMulti.addAP("Crispy", "peppersalt");
  WiFiMulti.addAP(wifiSSID, wifiPass);

  //WiFi.disconnect();
  while(WiFiMulti.run() != WL_CONNECTED) {
    delay(100);
  }
  WiFi.macAddress(mac);
  // byte myByte = 0x0A;
  // char hexStr[3]; // 2 characters + null terminator

  // %02X: 0 = pad with zeros, 2 = width of 2, X = uppercase HEX
  sprintf(macStr, "%02X%02X", mac[4], mac[5]); 

  Serial.println(macStr); // Output: 0A
  
  // macString = String((char *)mac);
  // Serial.println(macString);

  // server address, port and URL
  // webSocket.begin("192.168.0.102", 8011, "/");
  webSocket.begin(websocketServerAdress, 8011, "/");

  // event handler
  webSocket.onEvent(webSocketEvent);

  // use HTTP Basic Authorization this is optional remove if not needed
  //webSocket.setAuthorization("user", "Password");

  // try ever 5000 again if connection has failed
  webSocket.setReconnectInterval(5000);
  // M5.IMU.Init();
  updateM5();

  // Serial.print("gRes:");
  // Serial.println(M5.IMU.gRes);
  // Serial.print("aRes:");
  // Serial.println(M5.IMU.aRes);
  displayLastShown=millis();
    // M5.Lcd.setTextFont(&fonts::FreeMonoBold9pt7b);
}

float temp = 0;


void loop(void)
{
  M5.update();
  auto imu_update = M5.Imu.update();
  if (imu_update) {
    auto ImuData = M5.Imu.getImuData();
      accX=ImuData.accel.x;      // accel x-axis value.
      accY=ImuData.accel.y;      // accel y-axis value.
      accZ=ImuData.accel.z;      // accel z-axis value.

      gyroX=ImuData.gyro.x;      // gyro x-axis value.
      gyroY=ImuData.gyro.y;      // gyro y-axis value.
      gyroZ=ImuData.gyro.z;      // gyro z-axis value.
      rollNow = atan2(accY, accZ);
      pitchNow = atan2((-accX), sqrt(accY * accY + accZ * accZ));
      float calcRollNowDeg = rollNow * 57.3;
      float calcPitchNowDeg = pitchNow * 57.3;
      if(abs(rollNowDeg-calcRollNowDeg)>attitudeChangeThreshold || abs(pitchNowDeg-calcPitchNowDeg)>attitudeChangeThreshold ){
        sendAttitudeEnabled=true;
      } else {
        sendAttitudeEnabled=false;
      }
      pitchNowDeg=calcPitchNowDeg;
      rollNowDeg=calcRollNowDeg;
  }

  

  // Serial.print("pitch: ");
  // Serial.print(pitchNowDeg);
  // Serial.print(", roll: ");
  // Serial.print(rollNowDeg);
  // Serial.println();
    //     ImuData.gyro.value;  // gyro 3values array [0]=x / [1]=y / [2]=z.
  // int batt=M5.Axp.GetBatPower();
  now=millis();
  if(displayIsOn && now > displayLastShown+showDisplayFor){
    displayIsOn=false;
    // M5.Axp.SetLDO2(false);
    M5.Display.setBrightness(0);
    Serial.println("vvv turning display off");
  }
  now=millis();
  if(now > lastHeartbeat + heartbeatInterval){
    sendHeartbeat();
    lastHeartbeat=now;
  }
  if(M5.BtnA.isPressed()){
    displayIsOn=true;
    // M5.Axp.SetLDO2(true);
    M5.Display.setBrightness(128);
    M5.Display.setBrightness(18);
    displayLastShown=now;
    Serial.println("^^^ turning display on ");
  }
  // M5.IMU.getGyroData(&gyroX,&gyroY,&gyroZ);
  // M5.IMU.getAccelData(&accX,&accY,&accZ);
  // M5.IMU.getAhrsData(&pitch,&roll,&yaw);
  // M5.IMU.getTempData(&temp);
  // Serial.print("gRes:");
  // Serial.println(M5.IMU.gRes*1000);
  // Serial.print("aRes:");
  // Serial.println(M5.IMU.aRes*1000);
  webSocket.loop();
  if(abs(accX)>accThreshold || abs(accY)>accThreshold || abs(accZ)>accThreshold){
    webSocket.sendTXT(String(macStr,4)+"TRIG");
    Serial.println(String(macStr,4)+"TRIG");
  }

  if(sendAttitudeEnabled){
    float rollShift=rollNowDeg+90.0F;
    if(rollShift<0.0F) rollShift=0.0F;
    if(rollShift>180.0F) rollShift=180.0F;
    int roll=rollShift*10;
    // char attitudeBuffer[5];
    snprintf(attitudeBuffer, sizeof(attitudeBuffer), "%04d", roll);
    Serial.print("ROLL");
    Serial.print(attitudeBuffer);
    Serial.println("deg");
    webSocket.sendTXT(String(macStr,4)+"ROLL"+attitudeBuffer);

    float pitchShift=pitchNowDeg+90.0F;
    if(pitchShift<0.0F) pitchShift=0.0F;
    if(pitchShift>180.0F) pitchShift=180.0F;
    int pitch=pitchShift*10;
    // char attitudeBuffer[5];
    snprintf(attitudeBuffer, sizeof(attitudeBuffer), "%04d", pitch);
    Serial.print("PTCH");
    Serial.print(attitudeBuffer);
    Serial.println("deg");
    // pitchNowDeg
    webSocket.sendTXT(String(macStr,4)+"PTCH"+attitudeBuffer);
  }
 
  delay(100);

    // auto imu_update = M5.Imu.update();
    // if (imu_update) {
    //     M5.Lcd.setCursor(0, 5);
    //     M5.Lcd.clear();

    //     auto ImuData = M5.Imu.getImuData();

    //     // The ImuData obtained by getImuData can be used as follows.
    //     ImuData.accel.x;      // accel x-axis value.
    //     ImuData.accel.y;      // accel y-axis value.
    //     ImuData.accel.z;      // accel z-axis value.
    //     ImuData.accel.value;  // accel 3values array [0]=x / [1]=y / [2]=z.

    //     ImuData.gyro.x;      // gyro x-axis value.
    //     ImuData.gyro.y;      // gyro y-axis value.
    //     ImuData.gyro.z;      // gyro z-axis value.
    //     ImuData.gyro.value;  // gyro 3values array [0]=x / [1]=y / [2]=z.

    //     M5.Lcd.printf("IMU:\n\n");
    //     M5.Lcd.printf(" ax:%6.2f\n ay:%6.2f\n az:%6.2f\r\n", ImuData.accel.x, ImuData.accel.y, ImuData.accel.z);
    //     M5.Lcd.println();
    //     M5.Lcd.printf(" gx:%6.2f\n gy:%6.2f\n gz:%6.2f\r\n", ImuData.gyro.x, ImuData.gyro.y, ImuData.gyro.z);
    // }
    // delay(500);
} 

void sendHeartbeat(){
  webSocket.sendTXT(String(macStr,4)+"HTBT");
}

void checkForID(String data){
  String ids;
  if(data.substring(0,3)=="WID"){
    ids=data.substring(3);
    myIDs=ids;
  }
  USE_SERIAL.printf("[WSc] myID: %s\n", ids);
  updateM5();
}

void checkForAth(String data){
  String thresholdS;
  if(data.substring(0,3)=="ATH"){
    thresholdS=data.substring(3);
    float threshold=thresholdS.toFloat();
    Serial.print("New Threshold:");
    Serial.println(threshold);
    accThreshold=threshold;
  }
  // USE_SERIAL.printf("[WSc] myID: %s\n", ids);
  // updateM5();
}

void updateM5(){
  M5.Lcd.setRotation(3);
  M5.Lcd.setTextColor(0x00, 0x51d);
  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setTextSize(1);
  M5.Lcd.setCursor(0, 0);
  M5.Lcd.println("Silvia sounds 2026");
  M5.Lcd.setCursor(0, 10);
  M5.Lcd.setTextColor(0xFF, 0x00);
  M5.Lcd.println(connected?"Connected":"disconnected");
  M5.Lcd.setCursor(0, 20);
  M5.Lcd.print("MAC: ");
  M5.Lcd.print(mac[0],HEX);
  M5.Lcd.print(":");
  M5.Lcd.print(mac[1],HEX);
  M5.Lcd.print(":");
  M5.Lcd.print(mac[2],HEX);
  M5.Lcd.print(":");
  M5.Lcd.print(mac[3],HEX);
  M5.Lcd.print(":");
  M5.Lcd.print(mac[4],HEX);
  M5.Lcd.print(":");
  M5.Lcd.println(mac[5],HEX);
  M5.Lcd.setCursor(0, 30);
  M5.Lcd.println('batt not read');
  // M5.Lcd.println(M5.Axp.GetBatPower());
  M5.Lcd.setCursor(0, 40);
  M5.Lcd.setTextSize(1);
  M5.Lcd.setTextColor(0x00, 0xfbe4);
  M5.Lcd.printf("pitch: %.1fc, roll: %.1fc",pitchNowDeg, rollNowDeg);
  // M5.Lcd.print(pitchNowDeg);
  // M5.Lcd.print("  roll: ");
  M5.Lcd.setCursor(0, 60);
  M5.Lcd.setTextSize(5);
  M5.Lcd.setTextColor(0x00, 0xfbe4);
  M5.Lcd.println(myIDs);
  
}