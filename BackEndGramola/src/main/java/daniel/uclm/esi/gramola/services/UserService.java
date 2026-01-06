package daniel.uclm.esi.gramola.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import daniel.uclm.esi.gramola.dao.UserDao;
import daniel.uclm.esi.gramola.models.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {

    @Autowired
    private UserDao userDao;

	@Autowired
	private EmailService emailService;

	@Autowired
	private GeocodingService geocodingService;

	@Value("${app.base.url}")
	private String baseUrl;

    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

	public void register(String email, String pwd, String accessToken, String privateToken, String subscriptionExpiry, String firma, String nombreBar, String ubicacionBar, Double costeCancion){

		Optional<User> optUser = userDao.findById(email);

		if (optUser.isEmpty()){
			User user = new User();
			user.setEmail(email);
			user.setPwd(passwordEncoder.encode(pwd));
			if (firma != null && !firma.isBlank()) {
				user.setFirma(firma);
			}
			if (nombreBar != null && !nombreBar.isBlank()) {
				user.setNombreBar(nombreBar);
			}
			if (ubicacionBar != null && !ubicacionBar.isBlank()) {
				user.setUbicacionBar(ubicacionBar);
			}
			if (costeCancion != null) {
				user.setCosteCancion(costeCancion);
			}
			try {
				if (accessToken != null && !accessToken.isBlank()) {
					user.setSpotifyAccessToken(accessToken);
				}
				if (privateToken != null && !privateToken.isBlank()) {
					user.setSpotifyPrivateToken(privateToken);
				}
				// Set subscriptionExpiry: if not provided, default to yesterday (inactive subscription)
				if (subscriptionExpiry == null || subscriptionExpiry.isBlank()) {
					user.setSubscriptionExpiry(java.time.LocalDateTime.now().minusDays(1));
				} else {
					// Parse subscriptionExpiry if provided (accepts ISO-8601 or epoch millis)
					java.time.LocalDateTime expiry = parseExpiry(subscriptionExpiry);
					user.setSubscriptionExpiry(expiry);
				}
			} catch (ResponseStatusException rse) {
				throw rse;
			} catch (Exception ex) {
				logger.error("Error setting API tokens during registration for {}: {}", email, ex.getMessage(), ex);
				throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar los tokens");
			}
			this.userDao.save(user);
			
			// Enviar correo de activación
			try {
				String token = user.getCreationToken().getID();
				String activationUrl = baseUrl + "/users/activate/" + email + "?token=" + token;
				
				String subject = "Activa tu cuenta en Gramola";
				String htmlContent = buildActivationEmailHtml(email, activationUrl);
				
				emailService.sendHtmlEmail(email, subject, htmlContent);
				logger.info("Correo de activación enviado a: {}", email);
			} catch (Exception e) {
				logger.error("Error al enviar correo de activación a {}: {}", email, e.getMessage(), e);
				// No lanzamos excepción para no interrumpir el registro
			}
		}else{
			throw new ResponseStatusException(HttpStatus.CONFLICT, "El usuario ya existe");
		}
	}

    public void login(String email, String pwd) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()){
			User user = optUser.get();
			boolean matches = passwordEncoder.matches(pwd, user.getPwd());
			if (!matches) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Contraseña incorrecta");
			}
		}else{
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
    }

	private java.time.LocalDateTime parseExpiry(String val) {
		try {
			// Try ISO_LOCAL_DATE_TIME first
			return java.time.LocalDateTime.parse(val);
		} catch (java.time.format.DateTimeParseException ignored) {
		}
		try {
			// Try OffsetDateTime
			return java.time.OffsetDateTime.parse(val).toLocalDateTime();
		} catch (java.time.format.DateTimeParseException ignored) {
		}
		try {
			// Try epoch millis
			long epoch = Long.parseLong(val);
			return java.time.Instant.ofEpochMilli(epoch).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
		} catch (NumberFormatException ignored) {
		}
		throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "subscriptionExpiry debe ser ISO-8601 o epoch millis");
	}

    public void delete(String email) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			userDao.delete(user);
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
    }

	public void activate(String email, String token){
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()){
			User user = optUser.get();
			if (user.getCreationToken().equals(token)){
				user.setActivate();
				userDao.save(user);
			}else{
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token incorrecto");
			}
		}else{
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	public boolean isUserActive(String email) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			return user.isActive();
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	public String getActivationUrl(String email) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			String token = user.getCreationToken().getID();
			return baseUrl + "/users/activate/" + email + "?token=" + token;
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

    public String getSpotifyAccessToken(String email) throws Exception {
        Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()){
			User user = optUser.get();
			return user.getSpotifyAccessToken();
		}else{
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
    }

    public String getSpotifyPrivateToken(String email) throws Exception {
        Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()){
			User user = optUser.get();
			return user.getSpotifyPrivateToken();
		}else{
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
    }

	/**
	 * Devuelve true si el usuario tiene una suscripción activa (expiry > now).
	 */
	public boolean hasActiveSubscription(String email) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			return user.hasActiveSubscription();
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	public java.util.Map<String, Object> getUserData(String email) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			java.util.Map<String, Object> userData = new java.util.HashMap<>();
			userData.put("email", user.getEmail());
			userData.put("isActive", user.isActive());
			userData.put("hasActiveSubscription", user.hasActiveSubscription());
			userData.put("subscriptionExpiry", user.getSubscriptionExpiry());
			userData.put("ubicacionBar", user.getUbicacionBar());
			userData.put("nombreBar", user.getNombreBar());
			userData.put("costeCancion", user.getCosteCancion());
			userData.put("latitud", user.getLatitud());
			userData.put("longitud", user.getLongitud());
			return userData;
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	public void setBarData(String email, String ubicacionBar, String nombreBar) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			user.setUbicacionBar(ubicacionBar);
			user.setNombreBar(nombreBar);
			
			// Obtener coordenadas de la ubicación
			try {
				double[] coordenadas = geocodingService.obtenerCoordenadas(ubicacionBar);
				user.setLatitud(coordenadas[0]);
				user.setLongitud(coordenadas[1]);
				logger.info("Coordenadas actualizadas para el bar '{}': lat={}, lon={}", 
					nombreBar, coordenadas[0], coordenadas[1]);
			} catch (Exception e) {
				logger.error("Error al obtener coordenadas para '{}': {}", ubicacionBar, e.getMessage());
				// No lanzamos excepción para permitir guardar los datos del bar sin coordenadas
				// Opcionalmente podrías descomentar la siguiente línea si quieres que falle:
				// throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudieron obtener las coordenadas: " + e.getMessage());
			}
			
			userDao.save(user);
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	public void setCosteCancion(String email, Double costeCancion) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			user.setCosteCancion(costeCancion);
			userDao.save(user);
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	public Double getCosteCancion(String email) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			return user.getCosteCancion();
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	public void updatePassword(String email, String oldPassword, String newPassword) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			
			// Verificar que la contraseña antigua es correcta
			boolean matches = passwordEncoder.matches(oldPassword, user.getPwd());
			if (!matches) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La contraseña actual es incorrecta");
			}
			
			// Actualizar a la nueva contraseña
			user.setPwd(passwordEncoder.encode(newPassword));
			userDao.save(user);
			logger.info("Contraseña actualizada para usuario: {}", email);
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	/**
	 * Verifica si unas coordenadas están dentro del radio de 100 metros de las coordenadas del bar del usuario.
	 * Usa la fórmula de Haversine para calcular la distancia entre dos puntos geográficos.
	 * 
	 * @param email Email del usuario
	 * @param latitud Latitud de la ubicación a verificar
	 * @param longitud Longitud de la ubicación a verificar
	 * @return true si está dentro del radio de 100 metros, false en caso contrario
	 */
	public boolean checkProximity(String email, Double latitud, Double longitud) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			
			// Verificar que el usuario tiene coordenadas guardadas
			if (user.getLatitud() == null || user.getLongitud() == null) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no tiene coordenadas de bar registradas");
			}
			
			// Calcular distancia usando fórmula de Haversine
			double distancia = calcularDistanciaHaversine(
				user.getLatitud(), 
				user.getLongitud(), 
				latitud, 
				longitud
			);
			
			logger.info("Distancia calculada para usuario {}: {} metros", email, distancia);
			
			// Verificar si está dentro del radio de 100 metros
			return distancia <= 100.0;
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
	}

	/**
	 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
	 * 
	 * @param lat1 Latitud del primer punto
	 * @param lon1 Longitud del primer punto
	 * @param lat2 Latitud del segundo punto
	 * @param lon2 Longitud del segundo punto
	 * @return Distancia en metros
	 */
	private double calcularDistanciaHaversine(double lat1, double lon1, double lat2, double lon2) {
		final int RADIO_TIERRA = 6371000; // Radio de la Tierra en metros
		
		// Convertir grados a radianes
		double lat1Rad = Math.toRadians(lat1);
		double lat2Rad = Math.toRadians(lat2);
		double deltaLatRad = Math.toRadians(lat2 - lat1);
		double deltaLonRad = Math.toRadians(lon2 - lon1);
		
		// Aplicar fórmula de Haversine
		double a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
				   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
				   Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
		
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		
		// Calcular distancia
		double distancia = RADIO_TIERRA * c;
		
		return distancia;
	}

	/**
	 * Construye el contenido HTML del correo de activación
	 */
	private String buildActivationEmailHtml(String email, String activationUrl) {
		return """
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
					.content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
					.button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
					.button:hover { background-color: #45a049; }
					.footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>¡Bienvenido a Gramola!</h1>
					</div>
					<div class="content">
						<h2>Hola,</h2>
						<p>Gracias por registrarte en Gramola con el email: <strong>%s</strong></p>
						<p>Para activar tu cuenta, por favor haz clic en el siguiente enlace:</p>
						<p style="text-align: center;">
							<a href="%s" class="button">Activar mi cuenta</a>
						</p>
						<p>O copia y pega este enlace en tu navegador:</p>
						<p style="word-break: break-all; background-color: #e9e9e9; padding: 10px; border-radius: 3px;">
							%s
						</p>
						<p><strong>Nota:</strong> Este enlace es único y solo puede usarse una vez.</p>
					</div>
					<div class="footer">
						<p>Este es un correo automático, por favor no responder.</p>
						<p>&copy; 2026 Gramola - Sistema de música para bares</p>
					</div>
				</div>
			</body>
			</html>
			""".formatted(email, activationUrl, activationUrl);
	}

	public String getFirma(String email) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()) {
			User user = optUser.get();
			return user.getFirma();
		} else {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
		}
	}
}
