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
		const clientId = sessionStorage.getItem('clientId');
		const clientSecret = sessionStorage.getItem('clientSecret');
		
		if (savedEmail && clientId && clientSecret) {
			console.log('Sesión activa detectada, redirigiendo a gramola...');
			this.router.navigate(['/gramola']);
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
						clientSecret: this.userService.getSpotifyPrivateToken(email)
					}).subscribe({
						next: ({ clientId, clientSecret }) => {
							const hasClientId = !!clientId && clientId.trim().length > 0;
							const hasClientSecret = !!clientSecret && clientSecret.trim().length > 0;
							
							if (hasClientId && hasClientSecret) {
								// Guardar las credenciales en sessionStorage
								sessionStorage.setItem('clientId', clientId);
								sessionStorage.setItem('clientSecret', clientSecret);
								// Navegar a gramola, donde se iniciará el OAuth automáticamente
								this.router.navigate(['/gramola']);
							} else {
								alert('Debes registrar tus claves de Spotify primero.');
								this.router.navigate(['/registro']);
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
