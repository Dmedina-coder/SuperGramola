import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import io.github.bonigarcia.wdm.WebDriverManager;

public class NavegadorTest {
    private WebDriver driver;
    private WebDriverWait wait;
    
    public NavegadorTest() {
        // WebDriverManager gestiona automáticamente el driver
        WebDriverManager.chromedriver().setup();
        
        // Configurar opciones de Chrome
        ChromeOptions options = new ChromeOptions();
        // options.addArguments("--headless");
        options.addArguments("--start-maximized");
        options.addArguments("--disable-blink-features=AutomationControlled");
        
        // Inicializar el driver
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }
    
    // Navegar a una URL
    public void navegarA(String url) {
        System.out.println("Navegando a: " + url);
        driver.get(url);
    }
    
    // Hacer clic en un elemento por su ID
    public void hacerClicPorId(String id) {
        System.out.println("Haciendo clic en elemento con ID: " + id);
        WebElement elemento = wait.until(ExpectedConditions.elementToBeClickable(By.id(id)));
        elemento.click();
    }
    
    // Hacer clic en un elemento por su selector CSS
    public void hacerClicPorSelector(String selector) {
        System.out.println("Haciendo clic en elemento con selector: " + selector);
        WebElement elemento = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(selector)));
        elemento.click();
    }
    
    // Escribir texto en un campo de entrada
    public void escribirTexto(String selector, String texto) {
        System.out.println("Escribiendo '" + texto + "' en: " + selector);
        WebElement elemento = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(selector)));
        elemento.clear();
        elemento.sendKeys(texto);
    }
    
    // Obtener texto de un elemento
    public String obtenerTexto(String selector) {
        WebElement elemento = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(selector)));
        return elemento.getText();
    }
    
    // Esperar un tiempo determinado (en segundos)
    public void esperar(int segundos) {
        try {
            System.out.println("Esperando " + segundos + " segundos...");
            Thread.sleep(segundos * 1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    
    // Verificar si un elemento existe
    public boolean elementoExiste(String selector) {
        try {
            driver.findElement(By.cssSelector(selector));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    // Tomar una captura de pantalla
    public void tomarCaptura(String nombreArchivo) {
        try {
            java.io.File screenshot = ((org.openqa.selenium.TakesScreenshot) driver).getScreenshotAs(org.openqa.selenium.OutputType.FILE);
            java.nio.file.Files.copy(screenshot.toPath(), 
                new java.io.File(nombreArchivo).toPath(), 
                java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            System.out.println("Captura guardada: " + nombreArchivo);
        } catch (Exception e) {
            System.out.println("Error al tomar captura: " + e.getMessage());
        }
    }
    
    // Obtener título de la página
    public String obtenerTitulo() {
        return driver.getTitle();
    }
    
    // Cerrar el navegador
    public void cerrar() {
        System.out.println("Cerrando navegador...");
        if (driver != null) {
            driver.quit();
        }
    }
    
    public void switchToAlertAndAccept() {
        try {
            var alert = wait.until(ExpectedConditions.alertIsPresent());
            System.out.println("Aceptando alerta: " + alert.getText());
            alert.accept();
        } catch (Exception e) {
            System.out.println("No se encontró ninguna alerta.");
        }
    }
    
    public void rellenarFormularioStripe(String numeroTarjeta, String mesExpiracion, String anioExpiracion, String cvc, String codigoPostal) {
        System.out.println("Rellenando formulario de pago de Stripe...");
        
        try {
            esperar(2);
            driver.switchTo().frame(0);
            System.out.println("Cambiado al iframe de Stripe");
            
            // Rellenar número de tarjeta
            WebElement campoNumero = wait.until(ExpectedConditions.elementToBeClickable(By.name("cardnumber")));
            campoNumero.sendKeys(numeroTarjeta);
            System.out.println("Número de tarjeta ingresado");
            
            esperar(1);
            
            // Rellenar fecha de expiración
            WebElement campoExpiracion = wait.until(ExpectedConditions.elementToBeClickable(By.name("exp-date")));
            campoExpiracion.sendKeys(mesExpiracion + anioExpiracion);
            System.out.println("Fecha de expiración ingresada");
            
            esperar(1);
            
            // Rellenar CVC
            WebElement campoCvc = wait.until(ExpectedConditions.elementToBeClickable(By.name("cvc")));
            campoCvc.sendKeys(cvc);
            System.out.println("CVC ingresado");
            
            esperar(1);
            
            // Rellenar código postal si existe en el iframe
            if (codigoPostal != null && !codigoPostal.isEmpty()) {
                try {
                    WebElement campoPostal = driver.findElement(By.name("postal"));
                    campoPostal.sendKeys(codigoPostal);
                    System.out.println("Código postal ingresado");
                } catch (Exception e) {
                    System.out.println("Campo de código postal no encontrado en iframe");
                }
            }
            
            driver.switchTo().defaultContent();
            System.out.println("Formulario de Stripe completado exitosamente");
            
        } catch (Exception e) {
            driver.switchTo().defaultContent();
            System.out.println("Error al rellenar formulario de Stripe: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Método alternativo si Stripe usa un iframe único
    public void rellenarFormularioStripeSimple(String numeroTarjeta, String fechaExpiracion, String cvc) {
        System.out.println("Rellenando formulario de pago de Stripe (método simple)...");
        
        try {
            // Cambiar al iframe principal de Stripe
            WebElement stripeFrame = wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector("iframe[name*='stripe']")));
            driver.switchTo().frame(stripeFrame);
            
            // Rellenar campos
            wait.until(ExpectedConditions.elementToBeClickable(By.name("cardnumber"))).sendKeys(numeroTarjeta);
            wait.until(ExpectedConditions.elementToBeClickable(By.name("exp-date"))).sendKeys(fechaExpiracion);
            wait.until(ExpectedConditions.elementToBeClickable(By.name("cvc"))).sendKeys(cvc);
            
            // Volver al contenido principal
            driver.switchTo().defaultContent();
            
            System.out.println("Formulario de Stripe completado");
            
        } catch (Exception e) {
            driver.switchTo().defaultContent();
            System.out.println("Error: " + e.getMessage());
        }
    }
    
    public void depurarIframesStripe() {
        var iframes = driver.findElements(By.tagName("iframe"));
        System.out.println("=== Depuración de iframes ===");
        System.out.println("Total de iframes: " + iframes.size());
        
        for (int i = 0; i < iframes.size(); i++) {
            try {
                driver.switchTo().frame(i);
                java.util.List<WebElement> inputs = driver.findElements(By.tagName("input"));
                System.out.println("Iframe " + i + " - Inputs encontrados: " + inputs.size());
                
                for (WebElement input : inputs) {
                    System.out.println("  - name: " + input.getAttribute("name"));
                    System.out.println("  - placeholder: " + input.getAttribute("placeholder"));
                    System.out.println("  - aria-label: " + input.getAttribute("aria-label"));
                }
                
                driver.switchTo().defaultContent();
            } catch (Exception e) {
                driver.switchTo().defaultContent();
            }
        }
    }
}
