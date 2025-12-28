package daniel.uclm.esi.gramola;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GramolaApplication {

	public static void main(String[] args) {
		// Cargar .env (si existe) y establecer en System properties para que Spring los lea
		try {
			Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
			dotenv.entries().forEach(entry -> {
				String key = entry.getKey();
				String value = entry.getValue();
				if (System.getenv(key) == null && System.getProperty(key) == null && value != null) {
					System.setProperty(key, value);
				}
			});
		} catch (Exception ignored) {
		}

		SpringApplication.run(GramolaApplication.class, args);
	}

}
