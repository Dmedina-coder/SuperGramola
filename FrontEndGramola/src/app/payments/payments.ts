import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionStorageService } from '../sessionstorage.service';
import { PaymentService } from '../payment.service';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class Payments implements OnInit, AfterViewInit {
  private cardElement: any;
  
  subscriptionCost: number = 0;
  loading: boolean = false;
  error: string = '';
  success: string = '';
  
  cardHolder: string = '';
  userEmail: string = '';
  transactionDetails: any = null;

  constructor(
    private router: Router,
    private sessionStorage: SessionStorageService,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.userEmail = this.sessionStorage.getEmail() || ''; 
    if (!this.userEmail) {
      this.error = 'Usuario no autenticado';
      return;
    }
    
    // Verificar que Stripe esté disponible
    if (!this.paymentService.isStripeAvailable()) {
      this.error = 'Error al cargar Stripe';
      return;
    }
    
    // Crear el Card Element
    this.cardElement = this.paymentService.createCardElement();
    
    this.initializePayment();
  }

  ngAfterViewInit() {
    // Montar el Card Element después de que la vista esté lista
    if (this.cardElement) {
      const cardElementContainer = document.getElementById('card-element');
      
      if (cardElementContainer) {
        this.cardElement.mount('#card-element');
        
        // Manejar errores en tiempo real
        this.cardElement.on('change', (event: any) => {
          const displayError = document.getElementById('card-errors');
          if (displayError) {
            displayError.textContent = event.error ? event.error.message : '';
          }
        });
      }
    }
  }

  initializePayment() {
    this.loading = true;
    this.error = '';

    // Primero generamos el prepago en el backend
    this.paymentService.preparePayment().subscribe({
      next: (transactionDetails: any) => {
        this.transactionDetails = transactionDetails;
        
        // Luego obtenemos el coste de la suscripción
        this.getSubscriptionCost();
      },
      error: (err: any) => {
        console.error('Error al inicializar el pago:', err);
        this.error = 'Error al inicializar el pago. Intente nuevamente.';
        this.loading = false;
      }
    });
  }

  getSubscriptionCost() {
    this.loading = true;
    this.error = '';

    this.paymentService.getSubscriptionCost().subscribe({
      next: (cost: number) => {
        this.subscriptionCost = cost;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al obtener el coste:', err);
        this.subscriptionCost = 9.99; // Valor por defecto
        this.loading = false;
      }
    });
  }

  processPayment() {
    // Validaciones
    if (!this.cardHolder) {
      this.error = 'Por favor, ingrese el nombre del titular';
      return;
    }

    if (!this.transactionDetails || !this.transactionDetails.clientSecret) {
      console.error('Datos de transacción:', this.transactionDetails);
      this.error = 'Error: No se pudo inicializar la transacción. Intente recargar la página.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    // Confirmar el pago con Stripe usando el servicio
    this.paymentService.confirmCardPayment(
      this.transactionDetails.clientSecret,
      this.cardElement,
      this.cardHolder,
      this.userEmail
    ).then((result: any) => {
      if (result.error) {
        // Error en el pago de Stripe
        console.error('Error de Stripe:', result.error);
        this.error = result.error.message || 'Error al procesar el pago';
        this.loading = false;
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          // Pago exitoso, notificar al backend
          this.confirmPaymentInBackend(result.paymentIntent);
        } else {
          this.error = 'El pago no se completó correctamente';
          this.loading = false;
        }
      }
    }).catch((error: any) => {
      console.error('Error al confirmar el pago:', error);
      this.error = 'Error al procesar el pago. Intente nuevamente.';
      this.loading = false;
    });
  }

  confirmPaymentInBackend(paymentIntent: any) {
    const transactionId = this.transactionDetails.id || this.transactionDetails.transactionId;

    this.paymentService.confirmPaymentInBackend(
      this.userEmail,
      paymentIntent.id,
      this.subscriptionCost,
      transactionId
    ).subscribe({
      next: (response: any) => {
        this.success = 'Pago procesado exitosamente. Suscripción renovada.';
        this.loading = false;
        this.clearForm();
        
        // Actualizar el estado de suscripción en sessionStorage
        this.sessionStorage.setPremiumStatus(true);
        this.sessionStorage.setEmail(this.userEmail);
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/gramola']);
        }, 2000);
      },
      error: (err: any) => {
        console.error('Error al confirmar en el backend:', err);
        this.error = err.error?.message || 'Error al confirmar el pago. Contacte soporte.';
        this.loading = false;
      }
    });
  }

  clearForm() {
    this.cardHolder = '';
    if (this.cardElement) {
      this.cardElement.clear();
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
