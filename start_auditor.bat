@echo off
echo ========================================
echo    AUDITOR CERTY - Servidor Backend
echo ========================================
echo.

REM Verificar si la API key está configurada
if "%GEMINI_API_KEY%"=="" (
    echo [ERROR] No se encontro GEMINI_API_KEY
    echo.
    echo Por favor configura tu API key primero:
    echo   set GEMINI_API_KEY=tu_api_key_aqui
    echo.
    echo O hazlo permanente con:
    echo   setx GEMINI_API_KEY "tu_api_key_aqui"
    echo.
    pause
    exit /b 1
)

echo [OK] API Key configurada
echo.
echo Iniciando servidor en http://localhost:5000...
echo Presiona Ctrl+C para detener
echo.

python auditor_server.py
