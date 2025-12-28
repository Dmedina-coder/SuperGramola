package daniel.uclm.esi.gramola.services;

import org.springframework.stereotype.Service;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

import daniel.uclm.esi.gramola.dao.StripeTransactionDao;
import daniel.uclm.esi.gramola.dao.UserDao;
import daniel.uclm.esi.gramola.models.StripeTransaction;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class PaymentService {
	
	static {
	String stripeKey = System.getProperty("STRIPE_SECRET_KEY");
	if (stripeKey == null) stripeKey = System.getenv("STRIPE_SECRET_KEY");
	Stripe.apiKey = stripeKey;
	}

	@Autowired
	private StripeTransactionDao dao;
	@Autowired
	private UserDao userDao;
	
	private Double getCosteSuscripcionEuros() {
		String coste = System.getProperty("COSTE_SUSCRIPTION");
		if (coste == null) return 9.99; // Valor por defecto
		return Double.parseDouble(coste);
	}
	
	private long getCosteSuscripcionCentimos() {
		return (long) (getCosteSuscripcionEuros() * 100);
	}
	
	public StripeTransaction prepay() throws StripeException {
		PaymentIntentCreateParams createParams = new PaymentIntentCreateParams.Builder()
			.setCurrency("eur")
			.setAmount(getCosteSuscripcionCentimos())
			.build();
		PaymentIntent intent = PaymentIntent.create(createParams);
		JSONObject transactionDetails = new JSONObject(intent.toJson());
		StripeTransaction st = new StripeTransaction();
		st.setData(transactionDetails);
		this.dao.save(st);
	return st;
	}
	
	public Double getCosteSuscripcion() {
		return getCosteSuscripcionEuros();
	}
	
	public void confirmSubscription(String email, String paymentIntentId, Double amount, String transactionId) throws Exception {
		// Verificar que el usuario existe
		var optUser = userDao.findById(email);
		if (optUser.isEmpty()) {
			throw new IllegalArgumentException("Usuario no encontrado");
		}
		
		// Verificar que la transacción existe
		var optTransaction = dao.findById(transactionId);
		if (optTransaction.isEmpty()) {
			throw new IllegalArgumentException("Transacción no encontrada");
		}
		
		// Verificar el PaymentIntent con Stripe
		PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
		if (!"succeeded".equals(intent.getStatus())) {
			throw new IllegalStateException("El pago no ha sido completado");
		}
		
		// Verificar que el monto coincide
		long expectedAmount = (long) (amount * 100);
		if (intent.getAmount() != expectedAmount) {
			throw new IllegalArgumentException("El monto del pago no coincide");
		}
		
		// Activar la suscripción del usuario (1 mes desde ahora)
		var user = optUser.get();
		java.time.LocalDateTime newExpiry = java.time.LocalDateTime.now();
		user.setSubscriptionExpiry(newExpiry);
		
		// Asociar el email a la transacción
		var transaction = optTransaction.get();
		transaction.setEmail(email);
		
		// Guardar los cambios
		userDao.save(user);
		dao.save(transaction);
	}
	
	public StripeTransaction prepaySong(String email, Double amount) throws Exception {
		// Verificar que el usuario existe
		var optUser = userDao.findById(email);
		if (optUser.isEmpty()) {
			throw new IllegalArgumentException("Usuario no encontrado");
		}
		
		// Convertir el monto a céntimos
		long amountCents = (long) (amount * 100);
		
		// Crear el PaymentIntent en Stripe
		PaymentIntentCreateParams createParams = new PaymentIntentCreateParams.Builder()
			.setCurrency("eur")
			.setAmount(amountCents)
			.build();
		PaymentIntent intent = PaymentIntent.create(createParams);
		
		// Guardar la transacción
		JSONObject transactionDetails = new JSONObject(intent.toJson());
		StripeTransaction st = new StripeTransaction();
		st.setData(transactionDetails);
		st.setEmail(email);
		this.dao.save(st);
		
		return st;
	}
	
	public void confirmSongPayment(String email, String paymentIntentId, Double amount, String transactionId, String trackUri) throws Exception {
		// Verificar que el usuario existe
		var optUser = userDao.findById(email);
		if (optUser.isEmpty()) {
			throw new IllegalArgumentException("Usuario no encontrado");
		}
		
		// Verificar que la transacción existe
		var optTransaction = dao.findById(transactionId);
		if (optTransaction.isEmpty()) {
			throw new IllegalArgumentException("Transacción no encontrada");
		}
		
		// Verificar el PaymentIntent con Stripe
		PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
		if (!"succeeded".equals(intent.getStatus())) {
			throw new IllegalStateException("El pago no ha sido completado");
		}
		
		// Verificar que el monto coincide
		long expectedAmount = (long) (amount * 100);
		if (intent.getAmount() != expectedAmount) {
			throw new IllegalArgumentException("El monto del pago no coincide");
		}
		
		// Asociar el email a la transacción si aún no está asociado
		var transaction = optTransaction.get();
		if (transaction.getEmail() == null || transaction.getEmail().isBlank()) {
			transaction.setEmail(email);
		}
		
		// Asociar el trackUri a la transacción
		if (trackUri != null && !trackUri.isBlank()) {
			transaction.setTrackUri(trackUri);
		}
		
		dao.save(transaction);
	}
}
