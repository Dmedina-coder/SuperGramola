package daniel.uclm.esi.gramola.controller;

import daniel.uclm.esi.gramola.services.EmailService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-simple")
    public ResponseEntity<?> sendSimpleEmail(@RequestBody Map<String, String> request) {
        try {
            String to = request.get("to");
            String subject = request.get("subject");
            String text = request.get("text");
            
            emailService.sendSimpleEmail(to, subject, text);
            return ResponseEntity.ok(Map.of("message", "Correo enviado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al enviar el correo: " + e.getMessage()));
        }
    }

    @PostMapping("/send-html")
    public ResponseEntity<?> sendHtmlEmail(@RequestBody Map<String, String> request) {
        try {
            String to = request.get("to");
            String subject = request.get("subject");
            String htmlContent = request.get("htmlContent");
            
            emailService.sendHtmlEmail(to, subject, htmlContent);
            return ResponseEntity.ok(Map.of("message", "Correo HTML enviado exitosamente"));
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al enviar el correo: " + e.getMessage()));
        }
    }
}
