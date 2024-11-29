#include <SPI.h>
#include <mcp_can.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <map>
#include <vector>

#define CAN_CS_PIN  5
#define CAN_INT_PIN 4
#define PAYLOAD_INTERVAL_MS 1000

MCP_CAN canBus(CAN_CS_PIN);

std::map<unsigned long, std::vector<unsigned char>> mapCurrentCanMessages;
std::map<unsigned long, std::vector<unsigned char>> mapPreviousCanMessages;
unsigned long ulLastPayloadTime = 0;

const char* strWifiSsid      = "...";
const char* strWifiPassword  = "...";
const char* strServerUrl     = "http://arthurfetzner.com/api.php";

const std::map<unsigned long, std::vector<unsigned char>> mapMonitoredIds =
{
    {666 , {0, 2   }},
    {668 , {0, 2   }},
    {390 , {0      }},
    {502 , {2      }},
    {1502, {0      }},
    {848 , {5, 6, 7}}
};

void initializeWiFi()
{
    WiFi.begin(strWifiSsid, strWifiPassword);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(1000);
        Serial.println("Conectando ao Wi-Fi...");
    }
    Serial.println("Wi-Fi conectado.");
}

bool initializeCanBus()
{
    if (canBus.begin(MCP_ANY, CAN_500KBPS, MCP_8MHZ) != CAN_OK)
    {
        Serial.println("Falha ao inicializar o módulo MCP2515 CAN Bus.");
        return false;
    }

    canBus.setMode(MCP_NORMAL);
    Serial.println("Barramento CAN inicializado.");
    return true;
}

void setup()
{
    Serial.begin(115200);

    initializeWiFi();
    if (!initializeCanBus())
    {
        while (true) 
            delay(1000);
    }
}

std::vector<unsigned char> extractRelevantData(const unsigned char* puchBuffer, unsigned char ucLength, const std::vector<unsigned char>& rvecuchPositions)
{
    std::vector<unsigned char> vecuchExtractedData;
    if (puchBuffer == nullptr) return vecuchExtractedData;
    
    for (unsigned char uchPos : rvecuchPositions)
    {
        if (uchPos < ucLength)
            vecuchExtractedData.push_back(puchBuffer[uchPos]);
    }
    return vecuchExtractedData;
}

void reconnectWiFi()
{
    if (WiFi.status() == WL_CONNECTED) return;

    Serial.println("Wi-Fi desconectado. Tentando reconectar...");
    WiFi.disconnect();
    initializeWiFi();
}

void sendDataToServer(const std::map<unsigned long, std::vector<unsigned long>>& rmapMessages)
{
    reconnectWiFi();

    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Erro: Wi-Fi ainda desconectado.");
        return;
    }

    HTTPClient httpClient;
    httpClient.begin(strServerUrl);
    httpClient.addHeader("Content-Type", "text/plain");

    String strPayload;
    for (const auto& rMessage : rmapMessages)
    {
        strPayload += String(rMessage.first, HEX) + ":";
        for (unsigned long ulData : rMessage.second)
        {
            if (ulData < 0x10) strPayload += "0";
            strPayload += String(ulData, HEX) + " ";
        }
        strPayload.trim();
        strPayload += ";";
    }
    strPayload.trim();

    const int iResponseCode = httpClient.POST(strPayload);
    if (iResponseCode > 0) 
        Serial.printf("Resposta do servidor: %d\n", iResponseCode);
    else 
        Serial.printf("Erro ao enviar dados: %s\n", httpClient.errorToString(iResponseCode).c_str());

    httpClient.end();
}

unsigned long calculateSpeed()
{
    if (!mapCurrentCanMessages.count(666) || !mapCurrentCanMessages.count(668)) return 0;

    float fAvgSpeed = (mapCurrentCanMessages[666][0] + mapCurrentCanMessages[666][1] +
                      mapCurrentCanMessages[668][0] + mapCurrentCanMessages[668][1]) / 4.0;
    return static_cast<unsigned long>((fAvgSpeed * 1.25) - 0.55);
}

unsigned long calculateRPM()
{
    if (!mapCurrentCanMessages.count(390)) return 0;
    return mapCurrentCanMessages[390][0] * 100 / 3;
}

unsigned long calculateGear()
{
    if (!mapCurrentCanMessages.count(502)) return 0;
    return mapCurrentCanMessages[502][0] == 128;
}

unsigned long calculateLights()
{
    if (!mapCurrentCanMessages.count(1502)) return 0;
    switch (mapCurrentCanMessages[1502][0])
    {
        case 4 : return 1;
        case 5 : return 3;
        case 6 : return 2;
        default: return 0;
    }
}

unsigned long calculateBlinkers()
{
    if (mapCurrentCanMessages.count(848) && (mapCurrentCanMessages[848][2] & 0x10)) return 3;
    if (!mapCurrentCanMessages.count(848)) return 0;

    switch (mapCurrentCanMessages[848][0])
    {
        case 153: return 1;
        case 154: return 2;
        default : return 0;
    }
}

unsigned long calculateDoors()
{
    if (!mapCurrentCanMessages.count(848)) return 0;

    unsigned char ucDoorStatus = 0;
    if (mapCurrentCanMessages[848][1] & 0x20) ucDoorStatus |= 0b001;
    if (mapCurrentCanMessages[848][1] & 0x08) ucDoorStatus |= 0b010;
    if (mapCurrentCanMessages[848][2] & 0x08) ucDoorStatus |= 0b100;

    return ucDoorStatus;
}

void processAndSendCANMessages()
{
    unsigned long ulCurrentMillis = millis();
    if (ulCurrentMillis - ulLastPayloadTime < PAYLOAD_INTERVAL_MS) return;

    ulLastPayloadTime = ulCurrentMillis;

    std::map<unsigned long, unsigned long> mapProcessedData =
    {
        {0, calculateSpeed()   },
        {1, calculateRPM()     },
        {2, calculateGear()    },
        {3, calculateLights()  },
        {4, calculateBlinkers()},
        {5, calculateDoors()   }
    };

    sendDataToServer(mapProcessedData);
    mapPreviousCanMessages = mapCurrentCanMessages;
}

void loop()
{
    if (canBus.checkReceive() != CAN_MSGAVAIL) return;

    unsigned long ulCanId;
    unsigned char ucLength;
    unsigned char puchBuffer[8];

    canBus.readMsgBuf(&ulCanId, &ucLength, puchBuffer);

    if (!mapMonitoredIds.count(ulCanId)) return;

    std::vector<unsigned char> vecucRelevantData = extractRelevantData(puchBuffer, ucLength, mapMonitoredIds.at(ulCanId));
    if (vecucRelevantData.empty()) return;

    mapCurrentCanMessages[ulCanId] = vecucRelevantData;
    processAndSendCANMessages();
}
