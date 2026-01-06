import io.github.cdimascio.dotenv.Dotenv;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class App {
    public static void main(String[] args) throws Exception {
        Dotenv dotenv = Dotenv.load();
        
        System.out.println("Comenzando la aplicación...");
        NavegadorTest navegador = new NavegadorTest();
        // Navegación al sitio de SuperGramola
        navegador.navegarA(dotenv.get("SUPERGRAMOLA_URL"));
        navegador.esperar(5); // Esperar 5 segundos para observar

        // Formulario de registro
        Pruebas.FormularioRegistro(navegador);

        // Intento de inicio de sesión (cuenta desactivada)
        navegador.esperar(3);
        Pruebas.FormularioLogin(navegador);
        navegador.esperar(5); // Esperar 5 segundos para observar
        navegador.switchToAlertAndAccept();

        // Activar cuenta y volver a intentar inicio de sesión (Pedira pagar premium)
        Pruebas.ActivarCuenta(navegador);
        navegador.esperar(3);
        Pruebas.FormularioLogin(navegador);

        // Pagar suscripción premium
        navegador.esperar(3);
        Pruebas.PagarSuscripcion(navegador);

        // Configurar Spotify
        navegador.esperar(3);
        Pruebas.FormularioSpotify(navegador);

        // Iniciar sesión
        navegador.esperar(3);
        Pruebas.FormularioLogin(navegador);





        // Borrar cuenta
        Pruebas.BorrarCuenta(navegador);

        System.out.println("Fin del test de navegación.");
    }
    

}
