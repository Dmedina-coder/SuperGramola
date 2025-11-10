package daniel.uclm.esi.gramola.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import daniel.uclm.esi.gramola.dao.UserDao;
import daniel.uclm.esi.gramola.models.User;

@Service
public class UserService {

	@Autowired
	private UserDao userDao;

	private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	public void register(String email, String pwd){
		
		Optional<User> optUser = userDao.findById(email);

		if (optUser.isEmpty()){
			User user = new User();
			user.setEmail(email);
			user.setPwd(pwd);
			this.userDao.save(user);
		}else{
			throw new ResponseStatusException(HttpStatus.CONFLICT, "El usuario ya existe");
		}
	}

    public void login(String email, String pwd) {
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()){
			User user = optUser.get();
			passwordEncoder.matches(user.getPwd() , pwd);
		}else{
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe");
		}
    }

    public void delete(String email, String pwd) {

    }

	public void setAPITokens(String email, String accessToken, String privateToken){
		Optional<User> optUser = userDao.findById(email);
		if (optUser.isPresent()){
                    try {
                        User user = optUser.get();
                        user.setSpotifyAccessToken(accessToken);
                        user.setSpotifyPrivateToken(privateToken);
                        userDao.save(user);
                    } catch (Exception ex) {
						throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar los tokens");
                    }
		}else{
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
}
