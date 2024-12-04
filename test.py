import random
import subprocess
import time

def gerar_valores():
    a = random.randint(0, 90)
    b = random.randint(0, 4500)
    c = random.randint(0, 1)
    d = random.randint(0, 3)
    e = random.randint(0, 3)
    f = random.randint(0, 7)

    latitude_poa  = -30.033056
    longitude_poa = -51.23
    g = latitude_poa  + random.uniform(-0.0005, 0.0005)
    h = longitude_poa + random.uniform(-0.0005, 0.0005)

    return f"0,{a};1,{b};2,{c};3,{d};4,{e};5,{f};6,{g:.6f};7,{h:.6f}"

def enviar_dados():
    data = gerar_valores()
    comando = f"curl -X POST https://www.arthurfetzner.com/api.php -H \"Content-Type: text/plain\" -d \"{data}\""
    subprocess.run(comando, shell=True)

while True:
    enviar_dados()
    time.sleep(1)