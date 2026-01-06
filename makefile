# SuperGramola - Scripts de ejecución

# Arrancar Frontend y Backend en ventanas separadas
start-app:
	@echo "Iniciando Backend en nueva ventana..."
	@start powershell -NoExit -Command "cd BackEndGramola; ./mvnw spring-boot:run"
	@echo "Iniciando Frontend en nueva ventana..."
	@start powershell -NoExit -Command "cd FrontEndGramola; npm start"
	@echo "Aplicacion iniciada. Backend y Frontend ejecutandose en ventanas separadas."

# Arrancar tests en nueva ventana
start-tests:
	@echo "Ejecutando tests en nueva ventana..."
	@start powershell -NoExit -Command "cd Testing; java -cp 'bin;lib/*' Pruebas"
	@echo "Tests iniciados en ventana separada."

# Compilar backend
build-backend:
	@echo "Compilando Backend..."
	@cd BackEndGramola && ./mvnw clean install

# Instalar dependencias del frontend
install-frontend:
	@echo "Instalando dependencias del Frontend..."
	@cd FrontEndGramola && npm install

# Compilar tests
build-tests:
	@echo "Compilando Tests..."
	@cd Testing && javac -cp "lib/*" -d bin src/*.java src/io/github/cdimascio/dotenv/*.java src/io/github/cdimascio/dotenv/internal/*.java

# Limpiar proyectos
clean:
	@echo "Limpiando proyectos..."
	@cd BackEndGramola && ./mvnw clean
	@cd FrontEndGramola && if exist node_modules rmdir /s /q node_modules
	@cd Testing && if exist bin rmdir /s /q bin

# Ayuda
help:
	@echo "Comandos disponibles:"
	@echo "  make start-app       - Inicia Backend y Frontend en ventanas separadas"
	@echo "  make start-tests     - Ejecuta los tests en ventana separada"
	@echo "  make build-backend   - Compila el Backend"
	@echo "  make install-frontend - Instala dependencias del Frontend"
	@echo "  make build-tests     - Compila los tests"
	@echo "  make clean           - Limpia todos los proyectos"
	@echo "  make help            - Muestra esta ayuda"
