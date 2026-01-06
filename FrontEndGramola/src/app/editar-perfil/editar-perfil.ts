import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { SessionStorageService } from '../sessionstorage.service';
import { RouterModule } from '@angular/router';
import { SpotifyService } from '../spotify.service';


@Component({
	selector: 'app-editar-perfil',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule],
	templateUrl: './editar-perfil.html',
	styleUrl: './editar-perfil.css'
})
export class EditarPerfil implements OnInit {
  
	email: string | null = null
	pwdActual?: string
	pwd1?: string
	pwd2?: string
	clientId?: string
	clientSecret?: string
	nombreBar?: string
	ubicacionBar?: string
	costeCancion?: number

	actualizacionOK: boolean = false
	pwdDiferentes: boolean = false
	emailInvalido: boolean = false
	camposIncompletos: boolean = false
	pwdActualIncorrecta: boolean = false
	pwdDemasiadoCorta: boolean = false
  
	constructor(
		private service: UserService,
		private session: SessionStorageService,
		private router: Router,
		private spotifyService: SpotifyService
	) { }

	ngOnInit() {
		// Cargar el email del usuario desde la sesión
		this.email = this.session.getEmail();
		
		if (!this.email) {
			// Si no hay sesión, redirigir al login
			this.router.navigate(['/']);
			return;
		}

		// Cargar los datos actuales del usuario
		this.cargarDatosUsuario();
	}

	cargarDatosUsuario() {
		if (!this.email) return;

		// Cargar credenciales de Spotify
		this.service.getSpotifyAccessToken(this.email).subscribe({
			next: (clientId) => {
				this.clientId = clientId;
			},
			error: (err) => console.error('Error cargando Client ID:', err)
		});

		this.service.getSpotifyPrivateToken(this.email).subscribe({
			next: (clientSecret) => {
				this.clientSecret = clientSecret;
			},
			error: (err) => console.error('Error cargando Client Secret:', err)
		});

		this.service.getCosteCancion(this.email).subscribe({
			next: (coste) => {
				// Convertir de céntimos a euros
				this.costeCancion = coste;
			},
			error: (err) => console.error('Error cargando coste canción:', err)
		});

		// Cargar datos del bar
		this.service.getBarData(this.email).subscribe({
			next: (barData) => {
				this.nombreBar = barData.nombreBar;
				this.ubicacionBar = barData.ubicacionBar;
			},
			error: (err) => console.error('Error cargando datos del bar:', err)
		});
	}
  
	actualizarDatos() {
		// Validar email
		if (!this.email || !this.email.includes('@')) {
			console.error('El email es inválido');
			this.emailInvalido = true;
			return;
		}

		// Validar contraseñas (solo si se quiere cambiar)
		if (this.pwd1 || this.pwd2 || this.pwdActual) {
			// Si se proporciona algún campo de contraseña, todos son obligatorios
			if (!this.pwdActual || !this.pwd1 || !this.pwd2) {
				console.error('Para cambiar la contraseña debes completar todos los campos');
				this.camposIncompletos = true;
				window.alert('Para cambiar la contraseña debes proporcionar: contraseña actual, nueva contraseña y confirmar nueva contraseña');
				return;
			}
			
			if (this.pwd1 !== this.pwd2) {
				console.error('Las contraseñas no coinciden');
				this.pwdDiferentes = true;
				window.alert('Las nuevas contraseñas no coinciden');
				return;
			}

			if (this.pwd1.length < 8) {
				this.pwdDemasiadoCorta = true;
				window.alert('La nueva contraseña debe tener al menos 8 caracteres');
				return;
			}
		}

		// Validar campos de Spotify
		if (!this.clientId || !this.clientSecret) {
			console.error('Debes completar los campos de Spotify');
			this.camposIncompletos = true;
			return;
		}

		// Validar campos del bar
		if (!this.nombreBar || !this.ubicacionBar || this.costeCancion === undefined) {
			console.error('Debes completar todos los campos del bar');
			this.camposIncompletos = true;
			window.alert('Debes completar los campos: Nombre del Bar, Ubicación y Coste por Canción');
			return;
		}

		// Resetear flags de error
		this.pwdDiferentes = false;
		this.emailInvalido = false;
		this.camposIncompletos = false;
		this.pwdActualIncorrecta = false;
		this.pwdDemasiadoCorta = false;

		// Actualizar credenciales de Spotify
		if (this.clientId && this.clientSecret) {
			this.service.registerSpotify(this.email!, this.clientId, this.clientSecret).subscribe({
				next: (response) => {
					console.log('Credenciales de Spotify actualizadas', response);
					this.session.setSpotifyCredentials(this.clientId!, this.clientSecret!);
				},
				error: (error) => {
					console.error('Error actualizando credenciales de Spotify:', error);
				}
			});
		}

		// Actualizar coste de canción
		if (this.costeCancion !== undefined) {
			// Convertir de euros a céntimos
			const costeEnCentimos = Math.round(this.costeCancion * 100);
			this.service.setCosteCancion(this.email!, costeEnCentimos).subscribe({
				next: (response) => {
					console.log('Coste de canción actualizado', response);
				},
				error: (error) => {
					console.error('Error actualizando coste de canción:', error);
				}
			});
		}

		// Actualizar datos del bar (nombre y ubicación)
		if (this.nombreBar && this.ubicacionBar) {
			this.service.setBarData(this.email!, this.nombreBar, this.ubicacionBar).subscribe({
				next: (response) => {
					console.log('Datos del bar actualizados', response);
				},
				error: (error) => {
					console.error('Error actualizando datos del bar:', error);
					window.alert('Error al actualizar datos del bar: ' + (error.error?.message || error.message));
				}
			});
		}

		// Actualizar contraseña si se proporcionó
		if (this.pwd1 && this.pwd2 && this.pwdActual) {
			if (this.pwd1.length < 8) {
				this.pwdDemasiadoCorta = true;
				window.alert('La nueva contraseña debe tener al menos 8 caracteres');
				return;
			}
			
			this.service.updatePassword(this.email!, this.pwdActual, this.pwd1).subscribe({
				next: (response) => {
					console.log('Contraseña actualizada', response);
					// Limpiar campos de contraseña
					this.pwdActual = '';
					this.pwd1 = '';
					this.pwd2 = '';
				},
				error: (error) => {
					console.error('Error actualizando contraseña:', error);
					if (error.status === 401) {
						this.pwdActualIncorrecta = true;
						window.alert('La contraseña actual es incorrecta');
					} else {
						window.alert('Error al actualizar contraseña: ' + (error.error?.message || error.message));
					}
				}
			});
		}

		this.pwdDiferentes = false;
		this.emailInvalido = false;
		this.camposIncompletos = false;
		this.pwdActualIncorrecta = false;
		this.pwdDemasiadoCorta = false;
		this.actualizacionOK = true;

		window.alert('Datos actualizados correctamente.');
	}

	eliminarCuenta() {
		if (!this.email) {
			return;
		}

		const confirmacion = window.confirm(
			'¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.'
		);

		if (!confirmacion) {
			return;
		}

		this.service.deleteAccount(this.email).subscribe({
			next: (response) => {
				console.log('Cuenta eliminada correctamente', response);
				// Limpiar sesión
				this.session.clearAll();
				window.alert('Tu cuenta ha sido eliminada correctamente.');
				// Redirigir al inicio
				this.router.navigate(['/']);
			},
			error: (error) => {
				console.error('Error eliminando cuenta:', error);
				let errorMessage = 'Error al eliminar la cuenta.';
				if (error.error && error.error.message) {
					errorMessage = error.error.message;
				}
				window.alert(errorMessage);
			}
		});
	}

	abrirOpenStreetMap() {
		// Abrir OpenStreetMap en una nueva ventana
		const searchQuery = this.nombreBar ? encodeURIComponent(this.nombreBar + ', España') : 'España';
		const mapsUrl = `https://www.openstreetmap.org/search?query=${searchQuery}`;
		window.open(mapsUrl, '_blank', 'width=1000,height=700');
		
		// Mostrar instrucciones
		setTimeout(() => {
			alert('INSTRUCCIONES:\n\n' +
				'1. Busca tu ubicación en OpenStreetMap\n' +
				'2. Haz clic en el resultado correcto de la lista\n' +
				'3. En el panel que se abre, verás la dirección completa\n' +
				'4. Selecciona la dirección (arrastra el ratón sobre ella)\n' +
				'5. Copia con Ctrl+C\n' +
				'6. Pégala aquí con Ctrl+V\n\n' +
				'Formato recomendado: "Calle Nombre, Número, Código Postal Localidad, Provincia"');
		}, 500);
	}
}
