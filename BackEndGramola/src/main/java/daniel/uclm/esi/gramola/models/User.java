package daniel.uclm.esi.gramola.models;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

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

    private String spotifyAccessToken;
    private String spotifyPrivateToken;

    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	// Obtenemos la clave AES desde el .env
    private static final String AES_SECRET = System.getenv("AES_256_SECRET"); // debe tener 32 caracteres exactos

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

    public String getSpotifyAccessToken() throws Exception {
		String AccessTokenDecrypted = decrypt(this.spotifyAccessToken);
        return AccessTokenDecrypted;
    }

    public void setSpotifyAccessToken(String spotifyAccessToken) throws Exception {
		String AccessTokenEncrypted = encrypt(spotifyAccessToken);
        this.spotifyAccessToken = AccessTokenEncrypted;
    }  

    public String getSpotifyPrivateToken() throws Exception {
		String PrivateTokenDecrypted = decrypt(this.spotifyPrivateToken);
        return PrivateTokenDecrypted;
    }   

    public void setSpotifyPrivateToken(String spotifyPrivateToken) throws Exception {
		String PrivateTokenEncrypted = encrypt(spotifyPrivateToken);
        this.spotifyPrivateToken = PrivateTokenEncrypted;
    }

    // Método para encriptar un token
    public static String encrypt(String token) throws Exception {
        SecretKeySpec secretKey = new SecretKeySpec(AES_SECRET.getBytes(StandardCharsets.UTF_8), "AES");
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding"); // puedes cambiar a AES/GCM si prefieres más seguridad
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        byte[] encrypted = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encrypted);
    }

    // Método para desencriptar un token
    public static String decrypt(String encryptedToken) throws Exception {
        if (AES_SECRET == null || AES_SECRET.length() != 32) {
            throw new IllegalArgumentException("La clave AES_256_SECRET debe tener exactamente 32 caracteres.");
        }

        SecretKeySpec secretKey = new SecretKeySpec(AES_SECRET.getBytes(StandardCharsets.UTF_8), "AES");
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        byte[] decoded = Base64.getDecoder().decode(encryptedToken);
        byte[] decrypted = cipher.doFinal(decoded);
        return new String(decrypted, StandardCharsets.UTF_8);
    }
}
