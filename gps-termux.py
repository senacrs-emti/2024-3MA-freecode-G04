import subprocess
import time
import requests
import json

def obter_gps():
    gps_info = subprocess.run(['termux-location'], capture_output=True, text=True)
    if gps_info.returncode != 0 or not gps_info.stdout.strip():
        raise ValueError("Erro ao obter dados de GPS.")
    
    gps_data = json.loads(gps_info.stdout)
    return gps_data["latitude"], gps_data["longitude"]

def enviar_dados(latitude, longitude):
    url = "https://www.arthurfetzner.com/api.php"
    headers = {"Content-Type": "text/plain"}
    payload = f"6,{latitude};7,{longitude}"
    requests.post(url, headers=headers, data=payload)

while True:
    try:
        latitude, longitude = obter_gps()
        enviar_dados(latitude, longitude)
    except Exception as e:
        pass
    
    time.sleep(1)