package daniel.uclm.esi.gramola.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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

    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

	public void register(String email, String pwd, String accessToken, String privateToken, String subscriptionExpiry){

		Optional<User> optUser = userDao.findById(email);

		if (optUser.isEmpty()){
			User user = new User();
			user.setEmail(email);
			user.setPwd(passwordEncoder.encode(pwd));
			try {
				if (accessToken != null && !accessToken.isBlank()) {
					user.setSpotifyAccessToken(accessToken);
				}
				if (privateToken != null && !privateToken.isBlank()) {
					user.setSpotifyPrivateToken(privateToken);
				}
				// Set subscriptionExpiry: if not provided, default to now + 1 month
				if (subscriptionExpiry == null || subscriptionExpiry.isBlank()) {
					user.setSubscriptionExpiry(java.time.LocalDateTime.now().plusMonths(1));
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

    public void delete(String email, String pwd) {

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
}
