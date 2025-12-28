import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { SessionStorageService } from '../sessionstorage.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class LoginForm implements OnInit {
	loginForm : FormGroup;
	email? : string
	pwd? : string

	constructor(
		private formBuilder : FormBuilder,
		private userService : UserService,
		private router : Router,
		private sessionStorageService : SessionStorageService
	) {
		this.loginForm = this.formBuilder.group({
			email: ['', [Validators.required, Validators.email]],
			pwd: ['', [Validators.required, Validators.minLength(8)]]
		});
	}

	ngOnInit() {
		// Verificar si ya hay una sesión activa
		const savedEmail = this.sessionStorageService.getEmail();
		const clientId = this.sessionStorageService.getAccessToken();
		const clientSecret = this.sessionStorageService.getPrivateToken();
		const isPremium = this.sessionStorageService.getPremiumStatus();
		
		if (savedEmail && clientId && clientSecret) {
			console.log('Sesión activa detectada, verificando estado de suscripción...');
			
			// Verificar el estado actual de la suscripción con el backend
			this.userService.hasActiveSubscription(savedEmail).subscribe({
				next: (hasSubscription) => {
					this.sessionStorageService.setPremiumStatus(hasSubscription);
					
					if (hasSubscription) {
						console.log('Usuario con suscripción activa, redirigiendo a gramola...');
						this.router.navigate(['/gramola']);
					} else {
						console.log('Usuario sin suscripción activa, redirigiendo a payments...');
						this.router.navigate(['/payments']);
					}
				},
				error: (err) => {
					console.error('Error verificando suscripción:', err);
					// Si hay error, usar el valor guardado en sessionStorage
					if (isPremium) {
						this.router.navigate(['/gramola']);
					} else {
						this.router.navigate(['/payments']);
					}
				}
			});
		}
	}

	onSubmit() {
		if (this.loginForm.valid) {
			const { email, pwd } = this.loginForm.value;
			this.userService.login(email, pwd).subscribe({
				next: (response) => {
					console.log('Login exitoso:', response);
					if (email) {
						this.sessionStorageService.setEmail(email);
					}
					// Tras login, verificar que el usuario tenga credenciales de Spotify
					// El flujo OAuth se manejará automáticamente en gramola
					
					if (!email) {
						alert('Error: email no válido');
						return;
					}
					
					// Obtener las credenciales de Spotify del backend
					forkJoin({
						clientId: this.userService.getSpotifyAccessToken(email),
						clientSecret: this.userService.getSpotifyPrivateToken(email),
						hasSubscription: this.userService.hasActiveSubscription(email)
					}).subscribe({
						next: ({ clientId, clientSecret, hasSubscription }) => {
							const hasClientId = !!clientId && clientId.trim().length > 0;
							const hasClientSecret = !!clientSecret && clientSecret.trim().length > 0;
							
							// Guardar estado de suscripción
							this.sessionStorageService.setPremiumStatus(hasSubscription);
							
							// Si tiene credenciales de Spotify, guardarlas
							if (hasClientId && hasClientSecret) {
								this.sessionStorageService.setSpotifyCredentials(clientId, clientSecret);
							}
							
							// Verificar suscripción antes de navegar
							if (hasSubscription) {
								// Usuario con suscripción activa
								if (hasClientId && hasClientSecret) {
									// Tiene todo -> ir a gramola
									this.router.navigate(['/gramola']);
								} else {
									// Tiene suscripción pero no credenciales -> registrar Spotify
									alert('Por favor, registra tus claves de Spotify para usar la gramola.');
									this.router.navigate(['/registro']);
								}
							} else {
								// Usuario sin suscripción activa -> ir a payments
								this.router.navigate(['/payments']);
							}
						},
						error: (err) => {
							console.error('Error obteniendo credenciales de Spotify:', err);
							alert('Debes registrar tus claves de Spotify primero.');
							this.router.navigate(['/registro']);
						}
					});
				},
				error: (error) => {
					console.error('Error en login:', error);
					alert('Error en el login. Verifica tus credenciales.');
				}
			});
		}
	}
}
