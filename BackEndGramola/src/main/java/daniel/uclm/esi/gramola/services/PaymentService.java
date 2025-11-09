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
	Stripe.apiKey = "sk_test_51IdXSlAa8oIZJkgAbOulAX...";
	}
	@Autowired
	private StripeTransactionDao dao;
	@Autowired
	private UserDao userDao;
	public StripeTransaction prepay() throws StripeException {
		PaymentIntentCreateParams createParams = new PaymentIntentCreateParams.Builder()
			.setCurrency("eur")
			.setAmount(1000L)
			.build();
		PaymentIntent intent = PaymentIntent.create(createParams);
		JSONObject transactionDetails = new JSONObject(intent.toJson());
		StripeTransaction st = new StripeTransaction();
		st.setData(transactionDetails);
		this.dao.save(st);
	return st;
	}
}
