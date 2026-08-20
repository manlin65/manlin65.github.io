@echo off
setlocal
cd /d "%~dp0"
set PORT=8765
where py >nul 2>nul
if %errorlevel%==0 (
  start "KI Datenqualitaetscheck Server" cmd /k "cd /d "%~dp0" && py -m http.server %PORT%"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:%PORT%/index.html"
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "KI Datenqualitaetscheck Server" cmd /k "cd /d "%~dp0" && python -m http.server %PORT%"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:%PORT%/index.html"
  exit /b
)
start "" "%~dp0index.html"
echo Python wurde nicht gefunden. Die HTML-Datei wurde direkt geoeffnet.
pause
