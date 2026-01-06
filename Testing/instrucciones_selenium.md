# Automatización de Navegador para SuperGramola

## 📋 Requisitos Previos

1. **Google Chrome instalado** en tu sistema
2. **ChromeDriver** compatible con tu versión de Chrome

## 🚀 Instalación de ChromeDriver

### Opción 1: Instalación Automática (Recomendado)
Selenium Manager (incluido en Selenium 4.6+) descarga automáticamente el driver correcto.

### Opción 2: Instalación Manual
1. Verifica tu versión de Chrome: chrome://settings/help
2. Descarga ChromeDriver desde: https://chromedriver.chromium.org/downloads
3. Extrae el archivo `chromedriver.exe`
4. Colócalo en una carpeta y agrégala al PATH de Windows, o ponlo en `lib/`

## 📦 Dependencias Necesarias

Ya he descargado Selenium, pero necesitas todas sus dependencias. La forma más fácil es usar Maven o descargar manualmente:

### Dependencias adicionales necesarias:
- selenium-api
- selenium-chrome-driver
- selenium-support
- Y varias dependencias transitivas

**Opción recomendada:** Usar Maven o Gradle para gestionar dependencias automáticamente.

## 🎯 Uso de NavegadorTest

La clase `NavegadorTest` incluye métodos para:

### Navegación
```java
navegarA("https://tu-url.com")
```

### Interacciones
```java
hacerClicPorId("miBoton")
hacerClicPorSelector(".clase-css")
escribirTexto("#input-busqueda", "texto a escribir")
```

### Verificaciones
```java
String texto = obtenerTexto(".resultado")
boolean existe = elementoExiste("#miElemento")
String titulo = obtenerTitulo()
```

### Utilidades
```java
esperar(3) // espera 3 segundos
tomarCaptura("prueba.png")
cerrar() // cierra el navegador
```

## 💡 Ejemplo de Prueba para SuperGramola

```java
NavegadorTest test = new NavegadorTest();

// Navegar a tu aplicación
test.navegarA("http://localhost:8080");

// Ejemplo: Buscar una canción
test.escribirTexto("#buscar-cancion", "Bohemian Rhapsody");
test.hacerClicPorId("btn-buscar");
test.esperar(2);

// Verificar resultado
if (test.elementoExiste(".resultado-cancion")) {
    System.out.println("¡Canción encontrada!");
}

// Reproducir
test.hacerClicPorSelector(".btn-reproducir");

// Tomar captura
test.tomarCaptura("reproduciendo.png");

test.cerrar();
```

## 🔧 Compilar y Ejecutar

```powershell
# Compilar
javac -cp "lib/*" src/NavegadorTest.java -d bin/

# Ejecutar
java -cp "bin;lib/*" NavegadorTest
```

## 📝 Selectores CSS Comunes

- Por ID: `#miId`
- Por clase: `.miClase`
- Por etiqueta: `button`
- Por atributo: `[name='usuario']`
- Combinados: `div.contenedor button.primario`

## ⚠️ Solución de Problemas

### Error: "ChromeDriver not found"
- Asegúrate de tener ChromeDriver en el PATH o en `lib/`
- O especifica la ruta manualmente:
```java
System.setProperty("webdriver.chrome.driver", "ruta/a/chromedriver.exe");
```

### Error: "Session not created"
- Tu versión de ChromeDriver no coincide con tu Chrome
- Descarga la versión correcta de ChromeDriver

### El navegador se cierra inmediatamente
- Usa `esperar()` o el bloqueo con `System.in.read()` incluido en el main

## 🎨 Personalización

Puedes modificar las opciones de Chrome en el constructor:

```java
options.addArguments("--headless"); // Sin interfaz gráfica
options.addArguments("--window-size=1920,1080"); // Tamaño de ventana
options.addArguments("--incognito"); // Modo incógnito
```
