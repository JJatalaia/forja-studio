@echo off
rem ============================================================================
rem  JerS - Forja Studio: o botao de abrir.
rem
rem  Faz tres coisas, nesta ordem:
rem   1. se o estudio JA estiver no ar, so abre o navegador (nao liga em dobro);
rem   2. senao, liga o estudio e espera ele responder de verdade;
rem   3. so entao abre a pagina - para voce nunca ver "nao foi possivel conectar".
rem
rem  Nao termina com "exit": se der errado, a janela FICA aberta mostrando o erro.
rem  Janela que fecha sozinha esconde o problema (aprendido na marra em 16/10/2026).
rem ============================================================================
chcp 65001 >nul
title JerS - Forja Studio
cd /d "%~dp0"

rem caminhos escolhidos na instalacao (setup.py escreve este arquivo)
if exist "caminhos.bat" call "caminhos.bat"

set "PY=ComfyUI_windows_portable\python_embeded\python.exe"
if not exist "%PY%" (
  echo.
  echo   Nao achei o Python da ComfyUI em:
  echo     %CD%\%PY%
  echo.
  echo   Voce esta rodando este atalho de dentro da pasta do Forja Studio?
  echo   Se a ComfyUI estiver noutro lugar, rode o setup.py de novo.
  echo.
  pause
  exit /b 1
)

echo.
echo   Vendo se o estudio ja esta ligado...
powershell -NoProfile -Command "try{$null=Invoke-WebRequest 'http://127.0.0.1:8194/api/ocupado' -UseBasicParsing -TimeoutSec 3;exit 0}catch{exit 1}"
if not errorlevel 1 (
  echo   Ja estava ligado. Abrindo a pagina.
  start "" "http://127.0.0.1:8194"
  ping -n 3 127.0.0.1 >nul
  exit /b 0
)

echo   Ligando o estudio...
start "Forja Studio" /min "%PY%" -s "estudio\server.py"

echo   Esperando ele responder (ate 60 segundos)...
set TENTATIVA=0
:espera
set /a TENTATIVA+=1
ping -n 3 127.0.0.1 >nul
powershell -NoProfile -Command "try{$null=Invoke-WebRequest 'http://127.0.0.1:8194/api/ocupado' -UseBasicParsing -TimeoutSec 3;exit 0}catch{exit 1}"
if not errorlevel 1 goto pronto
if %TENTATIVA% LSS 30 goto espera

echo.
echo   O estudio nao respondeu em 60 segundos.
echo   Olhe a janela "Forja Studio" que abriu minimizada: o erro esta la.
echo.
pause
exit /b 1

:pronto
echo   Pronto. Abrindo http://127.0.0.1:8194
start "" "http://127.0.0.1:8194"
ping -n 3 127.0.0.1 >nul
