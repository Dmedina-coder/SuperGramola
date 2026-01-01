import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { SessionStorageService } from '../sessionstorage.service';
import { RouterModule } from '@angular/router';
import { SpotifyService } from '../spotify.service';


@Component({
	selector: 'app-registro',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule],
	templateUrl: './registro.html',
	styleUrl: './registro.css'
  })
  export class Registro {
  
	email?: string
	pwd1?: string
	pwd2?: string
	clientId?: string
	clientSecret?: string
	nombreBar?: string
	ubicacionBar?: string
	costeCancion?: number

	registroOK: boolean = false
	pwdDiferentes: boolean = false
	emailInvalido: boolean = false
	camposIncompletos: boolean = false
  
	constructor(
		private service: UserService,
		private session: SessionStorageService,
		private router: Router,
		private spotifyService: SpotifyService
	) { }
  
	registrar() {
		// Validar contraseñas
		if (this.pwd1 != this.pwd2) {
			console.error('Las contraseñas no coinciden');
			this.pwdDiferentes = true;
			return;
		}

		// Validar email
		if (!this.email || !this.email.includes('@')) {
			console.error('El email es inválido');
			this.emailInvalido = true;
			return;
		}

		// Validar campos de Spotify
		if (!this.clientId || !this.clientSecret) {
			console.error('Debes completar los campos de Spotify');
			this.camposIncompletos = true;
			return;
		}

		// Validar campos del bar
		if (!this.nombreBar || !this.ubicacionBar || !this.costeCancion) {
			console.error('Debes completar todos los campos del bar');
			this.camposIncompletos = true;
			return;
		}
  
		this.service.register(
			this.email!, 
			this.pwd1!, 
			this.pwd2!, 
			this.clientId!, 
			this.clientSecret!,
			this.nombreBar!,
			this.ubicacionBar!,
			this.costeCancion!
		).subscribe({
			next: (ok) => {
				console.log('Registro exitoso', ok);
				this.pwdDiferentes = false;
				this.emailInvalido = false;
				this.camposIncompletos = false;
				this.session.setEmail(this.email!);

				// Guardar credenciales de Spotify en sessionStorage
				sessionStorage.setItem('clientId', this.clientId!);
				sessionStorage.setItem('clientSecret', this.clientSecret!);

				console.log('Usuario y credenciales de Spotify registrados');

				// Guardar datos del bar mediante la llamada específica
				this.service.setBarData(this.email!, this.nombreBar!, this.ubicacionBar!).subscribe({
					next: (response) => {
						console.log('Datos del bar guardados', response);
					},
					error: (error) => {
						console.error('Error guardando datos del bar:', error);
					}
				});

				window.alert('Registro exitoso. Por favor, revise su correo para activar su cuenta.');

				// Navegar a Main menu, donde se iniciará el flujo OAuth
				this.router.navigate(['/']);
			},
			error: (error) => {
				console.error('Error en el registro', error);
				this.registroOK = false;
			}
		});
	}

	abrirGoogleMaps() {
		// Abrir Google Maps en una nueva ventana
		const searchQuery = this.nombreBar ? encodeURIComponent(this.nombreBar) : '';
		const mapsUrl = `https://www.google.com/maps/search/${searchQuery}`;
		window.open(mapsUrl, '_blank', 'width=800,height=600');
		
		// Mostrar instrucciones
		setTimeout(() => {
			alert('Busca tu ubicación en Google Maps, haz clic en el lugar correcto y copia la dirección completa que aparece.');
		}, 500);
	}
  }
  