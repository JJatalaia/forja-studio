@echo off
rem  Versao sem janela, usada pela abertura automatica do Windows.
rem  Liga o estudio e NAO abre navegador: quem acabou de entrar no Windows nao
rem  quer uma aba pulando na cara. A pagina fica esperando em 127.0.0.1:8194.
cd /d "%~dp0"
if exist "caminhos.bat" call "caminhos.bat"
set "PY=ComfyUI_windows_portable\python_embeded\python.exe"
if not exist "%PY%" exit /b 1
powershell -NoProfile -Command "try{$null=Invoke-WebRequest 'http://127.0.0.1:8194/api/ocupado' -UseBasicParsing -TimeoutSec 3;exit 0}catch{exit 1}"
if not errorlevel 1 exit /b 0
start "Forja Studio" /min "%PY%" -s "estudio\server.py"
