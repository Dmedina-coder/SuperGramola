package daniel.uclm.esi.gramola.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import daniel.uclm.esi.gramola.models.StripeTransaction;
import daniel.uclm.esi.gramola.services.PaymentService;
import jakarta.servlet.http.HttpSession;

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
}
