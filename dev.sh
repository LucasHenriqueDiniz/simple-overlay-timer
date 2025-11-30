#!/bin/bash
# Script para executar o Tauri dev no Git Bash com Visual Studio configurado

# Adicionar Cargo ao PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Configurar ambiente do Visual Studio e executar
VS_PATH="/c/Program Files/Microsoft Visual Studio/2022/Community/VC/Auxiliary/Build/vcvars64.bat"
if [ ! -f "$VS_PATH" ]; then
    VS_PATH="/c/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/VC/Auxiliary/Build/vcvars64.bat"
fi

if [ -f "$VS_PATH" ]; then
    echo "Configuring Visual Studio environment and starting Tauri dev..."
    # Converter caminho do Git Bash para Windows
    WIN_PATH=$(pwd | sed 's|^/e/|E:\\|' | sed 's|/|\\|g')
    # Executar tudo no contexto do Visual Studio
    cmd.exe //c "\"$VS_PATH\" && cd /d \"$WIN_PATH\" && npm run tauri dev"
else
    echo "ERROR: Visual Studio Build Tools not found!"
    exit 1
fi
