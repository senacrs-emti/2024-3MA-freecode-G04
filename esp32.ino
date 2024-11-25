#include <SPI.h>
#include <mcp_can.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <map>

#define CAN_CS_PIN  5
#define CAN_INT_PIN 4
MCP_CAN CAN(CAN_CS_PIN);

std::map<long unsigned int, String> mapCanMessages;
std::map<long unsigned int, String> mapPreviousMessages;
unsigned long ulLastPrintTime = 0;

const char* strSsid      = "...";
const char* strPassword  = "...";
const char* strServerUrl = "http://arthurfetzner.com/api.php";

void setupWiFi()
{
    WiFi.begin(strSsid, strPassword);
    while (WiFi.status() != WL_CONNECTED)
        delay(1000);
}

bool setupCAN()
{
    if (CAN.begin(MCP_ANY, CAN_500KBPS, MCP_8MHZ) != CAN_OK)
    {
        Serial.println("Erro ao inicializar o módulo CAN Bus MCP2515");
        return false;
    }
    CAN.setMode(MCP_NORMAL);
    return true;
}

String convertCANDataToString(unsigned char* pucBuf, unsigned char ucLen)
{
    String strData = "";
    for (int i = 0; i < ucLen; i++)
    {
        if (pucBuf[i] < 0x10) strData += "0";
        strData += String(pucBuf[i], HEX);
        if (i < ucLen - 1) strData += " ";
    }
    return strData;
}

void sendDataToServer(String strJsonPayload)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Erro: Wi-Fi desconectado");
        return;
    }

    HTTPClient http;
    http.begin(strServerUrl);
    http.addHeader("Content-Type", "application/json");

    int iHttpResponseCode = http.POST(strJsonPayload);
    if (iHttpResponseCode > 0)
    {
        Serial.print("Resposta do servidor: ");
        Serial.println(iHttpResponseCode);
    }
    else
    {
        Serial.print("Erro ao enviar dados: ");
        Serial.println(http.errorToString(iHttpResponseCode).c_str());
    }

    http.end();
}

void checkAndSendCANMessages()
{
    unsigned long ulCurrentMillis = millis();
    if (ulCurrentMillis - ulLastPrintTime < 1000) return;

    ulLastPrintTime = ulCurrentMillis;

    String strJsonPayload = "{";
    bool bHasChanges = false;

    for (auto const& rEntry : mapCanMessages)
    {
        if (mapPreviousMessages.find(rEntry.first) != mapPreviousMessages.end() && mapPreviousMessages[rEntry.first] == rEntry.second)
            continue;
        
        if (bHasChanges) strJsonPayload += ", ";
        strJsonPayload += "\"" + String(rEntry.first, HEX) + "\": \"" + rEntry.second + "\"";
        bHasChanges = true;
    }

    strJsonPayload += "}";

    if (!bHasChanges)
        return;
    
    Serial.println(strJsonPayload);
    sendDataToServer(strJsonPayload);
    mapPreviousMessages = mapCanMessages;
}

void loop()
{
    if (CAN.checkReceive() != CAN_MSGAVAIL) return;

    long unsigned int ulCanId;
    unsigned char ucLen = 0;
    unsigned char arrBuf[8];

    CAN.readMsgBuf(&ulCanId, &ucLen, arrBuf); 
    String strData = convertCANDataToString(arrBuf, ucLen);
    mapCanMessages[ulCanId] = strData;

    checkAndSendCANMessages();
}

void setup()
{
    Serial.begin(115200);

    setupWiFi();
    if (!setupCAN()) return;
}
