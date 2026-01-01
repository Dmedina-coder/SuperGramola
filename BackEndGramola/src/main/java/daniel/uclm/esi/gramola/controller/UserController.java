package daniel.uclm.esi.gramola.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.view.RedirectView;

import daniel.uclm.esi.gramola.services.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

	@Autowired
	private UserService userService;

	@PostMapping("/register")
	public void register(@RequestBody Map<String, String> userData) {
		String email = userData.get("email");
		String password = userData.get("pwd");
		String password2 = userData.get("pwd2");
		String accessToken = userData.get("accessToken");
		String privateToken = userData.get("privateToken");
		String subscriptionExpiry = userData.get("subscriptionExpiry");

		if (!password.equals(password2)) {
			throw new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE,"Las contraseñas no coinciden");
		} 
		if (password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE,"La contraseña es demasiado corta");
		}	
		if (!email.contains("@")) {
			throw new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE,"El email no es válido");
		}

		userService.register(email, password, accessToken, privateToken, subscriptionExpiry);
	}

	@PostMapping("/login")
	public void login(@RequestBody Map<String, String> userData){
		String email = userData.get("email");
		String pwd = userData.get("pwd");

		userService.login(email, pwd);

	}

	@DeleteMapping("/delete/{email}")
	public void delete(@PathVariable String email){
		userService.delete(email);
	}

	@GetMapping("/activate/{email}")
	public RedirectView activate(@PathVariable String email, @RequestParam String token){
		userService.activate(email, token);
		return new RedirectView("http://localhost:4200/");
	}

	@GetMapping("/{email}/is-active")
	public boolean isUserActive(@PathVariable String email) {
		try {
			return userService.isUserActive(email);
		} catch (Exception e) {
			if (e instanceof ResponseStatusException) throw (ResponseStatusException) e;
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@GetMapping("/{email}/activation-url")
	public String getActivationUrl(@PathVariable String email) {
		try {
			return userService.getActivationUrl(email);
		} catch (Exception e) {
			if (e instanceof ResponseStatusException) throw (ResponseStatusException) e;
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@GetMapping("/{email}/spotify/access")
	public String getSpotifyAccessToken(@PathVariable String email) {
		try {
			return userService.getSpotifyAccessToken(email);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@GetMapping("/{email}/spotify/private")
	public String getSpotifyPrivateToken(@PathVariable String email) {
		try {
			return userService.getSpotifyPrivateToken(email);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@GetMapping("/{email}/subscription/active")
	public boolean hasActiveSubscription(@PathVariable String email) {
		try {
			return userService.hasActiveSubscription(email);
		} catch (Exception e) {
			if (e instanceof ResponseStatusException) throw (ResponseStatusException) e;
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@GetMapping("/{email}/data")
	public Map<String, Object> getUserData(@PathVariable String email) {
		try {
			return userService.getUserData(email);
		} catch (Exception e) {
			if (e instanceof ResponseStatusException) throw (ResponseStatusException) e;
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@PutMapping("/{email}/bar-data")
	public Map<String, String> setBarData(@PathVariable String email, @RequestBody Map<String, String> barData) {
		try {
			String ubicacionBar = barData.get("ubicacionBar");
			String nombreBar = barData.get("nombreBar");
			userService.setBarData(email, ubicacionBar, nombreBar);
			return Map.of("message", "Datos del bar actualizados correctamente");
		} catch (Exception e) {
			if (e instanceof ResponseStatusException) throw (ResponseStatusException) e;
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@GetMapping("/{email}/bar-data")
	public Map<String, Object> getBarData(@PathVariable String email) {
		try {
			Map<String, Object> userData = userService.getUserData(email);
			return Map.of(
				"ubicacionBar", userData.get("ubicacionBar") != null ? userData.get("ubicacionBar") : "",
				"nombreBar", userData.get("nombreBar") != null ? userData.get("nombreBar") : ""
			);
		} catch (Exception e) {
			if (e instanceof ResponseStatusException) throw (ResponseStatusException) e;
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@PutMapping("/{email}/coste-cancion") 
	public Map<String, String> setCosteCancion(@PathVariable String email, @RequestBody Map<String, Object> costeData) {
		try {
			Double costeCancion = ((Number) costeData.get("costeCancion")).doubleValue();
			userService.setCosteCancion(email, costeCancion);
			return Map.of("message", "Coste de canción actualizado correctamente");
		} catch (Exception e) {
			if (e instanceof ResponseStatusException) throw (ResponseStatusException) e;
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}

	@GetMapping("/{email}/coste-cancion")
	public Double getCosteCancion(@PathVariable String email) {
		try {
			return userService.getCosteCancion(email);
		} catch (Exception e) {
			if (e instanceof ResponseStatusException) throw (ResponseStatusException) e;
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), e);
		}
	}
}
