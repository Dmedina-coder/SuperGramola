import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

declare let Stripe: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8080';
  private stripe: any;
  private stripePublicKey = 'pk_test_51SIV2E3BVfQVfjaVJc4zxt2nS712stJmDAtDHxmgE6JLcRTrd92Wto371taBxbjwxyseTK4WB5wZVJdD4Il53fLi00FlxBkyfJ';

  constructor(private http: HttpClient) {
    // Inicializar Stripe
    if (typeof Stripe !== 'undefined') {
      this.stripe = Stripe(this.stripePublicKey);
    }
  }

  /**
   * Inicializa Stripe Elements y crea un Card Element
   */
  createCardElement(style?: any): any {
    if (!this.stripe) {
      throw new Error('Stripe no está inicializado');
    }

    const elements = this.stripe.elements();
    const defaultStyle = {
      base: {
        fontSize: '16px',
        color: '#333',
        lineHeight: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4'
        },
        ':focus': {
          color: '#333'
        }
      },
      invalid: {
        color: '#c33',
        iconColor: '#c33'
      }
    };

    return elements.create('card', { 
      style: style || defaultStyle,
      hidePostalCode: false
    });
  }

  /**
   * Obtiene el coste de la suscripción desde el backend
   */
  getSubscriptionCost(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/payments/subscription-cost`).pipe(
      map(response => response.cost || response.amount || 9.99)
    );
  }

  /**
   * Prepara una transacción de pago en el backend
   */
  preparePayment(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payments/prepay`).pipe(
      map(transactionDetails => {
        // Parsear el campo data que contiene el PaymentIntent como JSON string
        if (transactionDetails.data) {
          const paymentIntentData = JSON.parse(transactionDetails.data);
          transactionDetails.clientSecret = paymentIntentData.client_secret;
          transactionDetails.paymentIntentId = paymentIntentData.id;
        }
        return transactionDetails;
      })
    );
  }

  /**
   * Confirma el pago con Stripe usando el Card Element
   */
  confirmCardPayment(
    clientSecret: string,
    cardElement: any,
    cardHolder: string,
    email: string
  ): Promise<any> {
    if (!this.stripe) {
      return Promise.reject(new Error('Stripe no está inicializado'));
    }

    return this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: cardHolder,
          email: email
        }
      }
    });
  }

  /**
   * Confirma el pago en el backend después de que Stripe lo haya procesado
   */
  confirmPaymentInBackend(
    email: string,
    paymentIntentId: string,
    amount: number,
    transactionId: string
  ): Observable<any> {
    const confirmationData = {
      email: email,
      paymentIntentId: paymentIntentId,
      amount: amount,
      transactionId: transactionId
    };

    return this.http.post<any>(`${this.apiUrl}/payments/confirm-subscription`, confirmationData);
  }

  /**
   * Verifica si Stripe está disponible
   */
  isStripeAvailable(): boolean {
    return typeof Stripe !== 'undefined' && this.stripe !== null;
  }

  /**
   * Prepara un pago por canción en el backend
   */
  prepareSongPayment(email: string, amount: number): Observable<any> {
    const paymentData = {
      email: email,
      amount: amount
    };
    return this.http.post<any>(`${this.apiUrl}/payments/prepay-song`, paymentData).pipe(
      map(transactionDetails => {
        // Parsear el campo data que contiene el PaymentIntent como JSON string
        if (transactionDetails.data) {
          const paymentIntentData = JSON.parse(transactionDetails.data);
          transactionDetails.clientSecret = paymentIntentData.client_secret;
          transactionDetails.paymentIntentId = paymentIntentData.id;
        }
        return transactionDetails;
      })
    );
  }

  /**
   * Confirma el pago de una canción en el backend
   */
  confirmSongPaymentInBackend(
    email: string,
    paymentIntentId: string,
    amount: number,
    transactionId: string,
    trackUri: string
  ): Observable<any> {
    const confirmationData = {
      email: email,
      paymentIntentId: paymentIntentId,
      amount: amount,
      transactionId: transactionId,
      trackUri: trackUri
    };

    console.log('📤 Datos enviados a /payments/confirm-song:', JSON.stringify(confirmationData, null, 2));
    return this.http.post<any>(`${this.apiUrl}/payments/confirm-song`, confirmationData);
  }

  /**
   * Procesa un pago rápido con tarjeta guardada o nueva
   */
  processQuickPayment(
    clientSecret: string,
    paymentMethodId?: string
  ): Promise<any> {
    if (!this.stripe) {
      return Promise.reject(new Error('Stripe no está inicializado'));
    }

    // Si hay un paymentMethodId, usarlo; si no, mostrar el método de pago predeterminado
    if (paymentMethodId) {
      return this.stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId
      });
    } else {
      // Para pagos rápidos sin tarjeta guardada, usar Payment Element
      return this.stripe.confirmCardPayment(clientSecret);
    }
  }
}
