#!/bin/bash
set -e

# Instalación de Python 3.10 si no está presente
if ! command -v python3.10 >/dev/null; then
  echo -e "Python 3.10 no encontrado. Instálalo antes de continuar.\nPrueba: sudo add-apt-repository ppa:deadsnakes/ppa \nY: sudo apt install python3.10-venv python3.10-distutils python3.10-full" >&2
  exit 1
fi

# Crear entorno virtual
python3.10 -m venv venvPrecios

# Activar entorno y actualizar pip
source venvPrecios/bin/activate
pip install --upgrade pip

# Instalar dependencias
pip install -r requirements.txt

# Descargar ChromeDriver 127
CHROME_DRIVER_URL="https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/127.0.6533.18/linux64/chromedriver-linux64.zip"
CHROME_DRIVER_ZIP="chromedriver-linux64.zip"

echo "Descargando ChromeDriver 127..."
curl -sSL "$CHROME_DRIVER_URL" -o "$CHROME_DRIVER_ZIP"

echo "Extrayendo ChromeDriver..."
unzip -o "$CHROME_DRIVER_ZIP"

# Mover binario a raíz del proyecto
mv -f chromedriver-linux64/chromedriver ./chromedriver
chmod +x ./chromedriver

# Limpiar carpeta y zip
rm -rf chromedriver-linux64 "$CHROME_DRIVER_ZIP"

echo "ChromeDriver 127 instalado en $(pwd)/chromedriver"

# Lanzar el servidor
python api/api.py
