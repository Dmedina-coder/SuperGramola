package daniel.uclm.esi.gramola.models;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;


@Entity
public class User {
	@Id
    private String email;
    private String pwd;
	@OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@JoinColumn(name = "Creation_Token_ID", referencedColumnName = "id")
    private Token creationToken = new Token();

    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPwd(String pwd) {
        // Encriptar la contraseña antes de almacenarla
        this.pwd = passwordEncoder.encode(pwd);
    }

    public String getPwd() {
        return this.pwd;
    }

    public boolean isActive() {
        return this.creationToken.isUsed();
    }

    public void setActivate() {
        this.creationToken.setUsedTime();
    }

    public Token getCreationToken() {
        return this.creationToken;
    }

	public void setCreationToken(Token creationToken) {
		this.creationToken = creationToken;
	}

    // Método para verificar si una contraseña coincide con la almacenada
    public boolean checkPwd(String rawPwd) {
        return passwordEncoder.matches(rawPwd, this.pwd);
    }
}
