@echo off
echo Ejecutando tests en nueva ventana...
start "Tests - SuperGramola" cmd /k "cd Testing && java -cp "bin;lib/*" Pruebas"

echo.
echo Tests iniciados en ventana separada.
echo.
