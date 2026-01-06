@echo off
echo Iniciando Backend en nueva ventana...
start "Backend - SuperGramola" cmd /k "cd BackEndGramola && spring-boot:run"

echo Iniciando Frontend en nueva ventana...
start "Frontend - SuperGramola" cmd /k "cd FrontEndGramola && npm start"

echo.
echo Aplicacion iniciada. Backend y Frontend ejecutandose en ventanas separadas.
echo.
