#!/bin/bash
set -e

# Instalación de Python 3.10 si no está presente
if ! command -v python3.10 >/dev/null; then
  echo "Python 3.10 no encontrado. Instálalo antes de continuar." >&2
  exit 1
fi

# Crear entorno virtual
python3.10 -m venv venvPrecios

# Activar entorno y actualizar pip
source venvPrecios/bin/activate
pip install --upgrade pip

# Instalar dependencias
pip install -r requirements.txt

# Lanzar el servidor
python api/api.py
