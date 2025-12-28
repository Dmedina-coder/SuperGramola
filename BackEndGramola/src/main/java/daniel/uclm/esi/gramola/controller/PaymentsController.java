package daniel.uclm.esi.gramola.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import daniel.uclm.esi.gramola.models.StripeTransaction;
import daniel.uclm.esi.gramola.services.PaymentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("payments")
@CrossOrigin(origins = { "http://localhost:4200", "http://127.0.0.1:4200" }, allowCredentials = "true")
public class PaymentsController {
	@Autowired
	private PaymentService service;
	@GetMapping("/prepay")
	public StripeTransaction prepay(HttpSession session) {
		try {
			StripeTransaction transactionDetails = this.service.prepay();
			session.setAttribute("transactionDetails", transactionDetails);
			return transactionDetails;
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
		}
	}



	@GetMapping("/subscription-cost")
	public Map<String, Double> getSubscriptionCost() {
		try {
			Double cost = this.service.getCosteSuscripcion();
			return Map.of("cost", cost);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
		}
	}

	@PostMapping("/confirm-subscription")
	public Map<String, String> confirmSubscription(@RequestBody Map<String, Object> paymentData) {
		try {
			String email = (String) paymentData.get("email");
			String paymentIntentId = (String) paymentData.get("paymentIntentId");
			Double amount = ((Number) paymentData.get("amount")).doubleValue();
			String transactionId = (String) paymentData.get("transactionId");
			
			this.service.confirmSubscription(email, paymentIntentId, amount, transactionId);
			return Map.of("message", "Suscripción activada correctamente");
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
		}
	}

	@PostMapping("/prepay-song")
	public Map<String, Object> prepaySong(@RequestBody Map<String, Object> paymentData) {
		try {
			String email = (String) paymentData.get("email");
			Double amount = ((Number) paymentData.get("amount")).doubleValue();
			
			StripeTransaction transaction = this.service.prepaySong(email, amount);
			
			// Extraer el client_secret del JSON de datos
			org.json.JSONObject data = new org.json.JSONObject(transaction.getData());
			String clientSecret = data.getString("client_secret");
			
			return Map.of(
				"transactionId", transaction.getId(),
				"clientSecret", clientSecret,
				"amount", amount
			);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
		}
	}

	@PostMapping("/confirm-song")
	public ResponseEntity<?> confirmSongPayment(@RequestBody Map<String, Object> confirmData) {
		try {
			String email = (String) confirmData.get("email");
			String paymentIntentId = (String) confirmData.get("paymentIntentId");
			Double amount = ((Number) confirmData.get("amount")).doubleValue();
			String transactionId = (String) confirmData.get("transactionId");
			String trackUri = (String) confirmData.get("trackUri");

			this.service.confirmSongPayment(email, paymentIntentId, amount, transactionId, trackUri);
			
			Map<String, String> response = new HashMap<>();
			response.put("status", "success");
			response.put("message", "Pago confirmado correctamente");
			
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.badRequest()
				.body(Map.of("error", e.getMessage()));
		}
	}
}
