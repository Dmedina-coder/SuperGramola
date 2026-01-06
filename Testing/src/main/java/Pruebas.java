import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Scanner;

import io.github.cdimascio.dotenv.Dotenv;

public class Pruebas {
    public static void FormularioRegistro(NavegadorTest navegador) {
        Dotenv dotenv = Dotenv.load();
        Scanner scanner = new Scanner(System.in);

        navegador.hacerClicPorSelector("body > app-root > div > app-main-menu > div > form > div > button:nth-child(1)");
        navegador.esperar(1);

        navegador.escribirTexto("#email", dotenv.get("USER_EMAIL"));
        navegador.esperar(1);
        navegador.escribirTexto("#pwd1", dotenv.get("USER_PASSWORD"));
        navegador.esperar(1);
        navegador.escribirTexto("#pwd2", dotenv.get("USER_PASSWORD"));
        navegador.esperar(1);
        navegador.escribirTexto("#nombreBar", "El Portón");
        navegador.esperar(1);
        navegador.escribirTexto("#ubicacionBar", "34, Avenida de Cristo Rey, Villarrubia de los Ojos, Ciudad Real, Castilla-La Mancha, 13670, España");        
        navegador.esperar(1);
        navegador.escribirTexto("#costeCancion", "0,50");
        navegador.esperar(1);
        navegador.escribirTexto("#clientId", dotenv.get("SPOTIFY_CLIENT_ID"));
        navegador.esperar(1);
        navegador.escribirTexto("#clientSecret", dotenv.get("SPOTIFY_CLIENT_SECRET"));
        navegador.esperar(5);
        System.out.println("Complete la FIRMA si es necesario y pulse ENTER para continuar...");
        scanner.nextLine(); // Pausa para que el usuario complete el FIRME si es necesario
        navegador.hacerClicPorSelector("body > app-root > div > app-registro > div > form > button");
        navegador.esperar(5);
        navegador.switchToAlertAndAccept();
    }

    public static void FormularioLogin(NavegadorTest navegador) {
        Dotenv dotenv = Dotenv.load();

        navegador.hacerClicPorSelector("body > app-root > div > app-main-menu > div > form > div > button:nth-child(2)");
        navegador.esperar(1);

        navegador.escribirTexto("#email", dotenv.get("USER_EMAIL"));
        navegador.esperar(1);
        navegador.escribirTexto("#pwd", dotenv.get("USER_PASSWORD"));
        navegador.esperar(1);
        navegador.hacerClicPorSelector("body > app-root > div > app-login > div > form > button");
        navegador.esperar(5);

    }

    public static void ActivarCuenta(NavegadorTest navegador) throws Exception {
        Dotenv dotenv = Dotenv.load();

        System.out.println("Obteniendo URL de activación...");
        String apiUrl = dotenv.get("API_URL"); // URL base de tu API
        String activationUrl = obtenerUrlActivacion(apiUrl, dotenv.get("USER_EMAIL"));
        System.out.println("URL de activación: " + activationUrl);
        navegador.navegarA(activationUrl);
        navegador.esperar(3);
    }

    private static String obtenerUrlActivacion(String apiUrl, String email) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/" + email + "/activation-url"))
                .GET()
                .build();
        
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    public static void PagarSuscripcion(NavegadorTest navegador) {
        navegador.escribirTexto("#cardHolder", "Daniel Medina");
        navegador.esperar(2);
        navegador.rellenarFormularioStripe("4242424242424242", "12", "34", "123", "12345");
        navegador.esperar(3);
        navegador.hacerClicPorSelector("body > app-root > div > app-payments > div > div > form > div.button-group > button.btn.btn-primary");
        navegador.esperar(5);
        navegador.switchToAlertAndAccept();
    }

    public static void FormularioSpotify(NavegadorTest navegador) {
        Dotenv dotenv = Dotenv.load();
        Scanner scanner = new Scanner(System.in);

        navegador.esperar(1);

        navegador.escribirTexto("#username", dotenv.get("USER_EMAIL"));
        navegador.esperar(1);
        navegador.hacerClicPorSelector("#__next > main > section > div > div > form > button");
        
        System.out.print("Ingrese el código PIN mostrado en pantalla: ");
        String pin = scanner.nextLine();
        System.out.println("PIN ingresado: " + pin);
        
        navegador.escribirTexto("#encore-web-main-content > div:nth-child(2) > div > div > div > form > div.EmailVerificationChallenge__InputBlock-sc-55dvy9-5.jipEUB > div:nth-child(1) > div:nth-child(1) > div > div:nth-child(1) > input", pin);
        navegador.switchToAlertAndAccept();
        //navegador.hacerClicPorSelector("#encore-web-main-content > div:nth-child(2) > div > div > div > form > div.EmailVerificationChallenge__InputBlock-sc-55dvy9-5.jipEUB > div:nth-child(2) > button");
        navegador.esperar(5);
    }

    public static void BorrarCuenta(NavegadorTest navegador) {
        Dotenv dotenv = Dotenv.load();

        navegador.navegarA(dotenv.get("SUPERGRAMOLA_URL"));
        navegador.esperar(1);
        navegador.hacerClicPorSelector("body > app-root > div > app-main-menu > div > form > div > button:nth-child(3)");
        navegador.esperar(5);
        navegador.hacerClicPorSelector("body > app-root > div > app-editar-perfil > div > form > button:nth-child(14)");        
        navegador.esperar(1);
        navegador.switchToAlertAndAccept();
    }

    public static void Gramola(NavegadorTest navegador) {
        Dotenv dotenv = Dotenv.load();

        navegador.hacerClicPorSelector("body > app-root > div > app-gramola > div > div > div > button:nth-child(5)");
        navegador.esperar(3);
        navegador.hacerClicPorSelector("body > app-root > div > app-gramola > div > div > div.playlist-section > div > button:nth-child(1)");
        navegador.esperar(5);
        navegador.hacerClicPorSelector("body > app-root > div > app-gramola > div > div > div.device-section > div > button:nth-child(1)");
        navegador.esperar(5);
        navegador.hacerClicPorSelector("body > app-root > div > app-gramola > div > div > button");
        navegador.esperar(3);
        navegador.escribirTexto("body > app-root > div > app-gramola > div > div > div.modal-overlay > div > div.modal-body > input", "Te quiero puta");
        navegador.esperar(3);
        navegador.hacerClicPorSelector("body > app-root > div > app-gramola > div > div > div.modal-overlay > div > div.modal-body > div > div:nth-child(1)");
        navegador.esperar(3);
        navegador.rellenarFormularioStripe("4242424242424242", "12", "34", "123", "12345");
        navegador.esperar(5);
        navegador.hacerClicPorSelector("body > app-root > div > app-gramola > div > div > div:nth-child(5) > div > div.modal-body.pin-modal-body > div.payment-buttons > button.btn.btn-primary");
        navegador.esperar(3);
        navegador.switchToAlertAndAccept();
    }


}
