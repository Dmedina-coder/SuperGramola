package daniel.uclm.esi.gramola.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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

		if (!password.equals(password2)) {
			throw new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE,"Las contraseñas no coinciden");
		} 
		if (password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE,"La contraseña es demasiado corta");
		}	
		if (!email.contains("@")) {
			throw new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE,"El email no es válido");
		}

		userService.register(email, password);
	}

	@PostMapping("/login")
	public void login(@RequestBody Map<String, String> userData){
		String email = userData.get("email");
		String pwd = userData.get("pwd");

		userService.login(email, pwd);

	}

	@DeleteMapping("/delete")
	public void delete(@RequestBody Map<String, String> userData){
			String email = userData.get("email");
			String pwd = userData.get("pwd");

			userService.delete(email, pwd);
	}

	@GetMapping("/activate/{email}")
	public void activate(@PathVariable String email, @RequestParam String token){

		userService.activate(email, token);
	}
}
