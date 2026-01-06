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
	
	// Modal de firma
	showSignatureModal: boolean = false
	signatureCanvas: any = null
	signatureContext: any = null
	isDrawing: boolean = false
	signatureData: string = ''
	hasSigned: boolean = false
  
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

		// Validar firma
		if (!this.hasSigned || !this.signatureData) {
			console.error('Debes firmar para completar el registro');
			alert('Por favor, firma en el campo de firma antes de registrarte.');
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
			this.costeCancion!,
			this.signatureData
		).subscribe({
			next: (ok) => {
				console.log('Registro exitoso', ok);
				this.pwdDiferentes = false;
				this.emailInvalido = false;
				this.camposIncompletos = false;

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

	// Modal de firma
	openSignatureModal() {
		this.showSignatureModal = true;
		setTimeout(() => this.initializeCanvas(), 100);
	}

	closeSignatureModal() {
		this.showSignatureModal = false;
	}

	initializeCanvas() {
		this.signatureCanvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
		if (!this.signatureCanvas) return;

		this.signatureContext = this.signatureCanvas.getContext('2d');
		this.signatureContext.strokeStyle = '#000000';
		this.signatureContext.lineWidth = 2;
		this.signatureContext.lineCap = 'round';

		// Eventos de ratón
		this.signatureCanvas.addEventListener('mousedown', (e: MouseEvent) => this.startDrawing(e));
		this.signatureCanvas.addEventListener('mousemove', (e: MouseEvent) => this.draw(e));
		this.signatureCanvas.addEventListener('mouseup', () => this.stopDrawing());
		this.signatureCanvas.addEventListener('mouseout', () => this.stopDrawing());

		// Eventos táctiles
		this.signatureCanvas.addEventListener('touchstart', (e: TouchEvent) => {
			e.preventDefault();
			this.startDrawing(e);
		});
		this.signatureCanvas.addEventListener('touchmove', (e: TouchEvent) => {
			e.preventDefault();
			this.draw(e);
		});
		this.signatureCanvas.addEventListener('touchend', () => this.stopDrawing());
	}

	getCoordinates(event: MouseEvent | TouchEvent): { x: number, y: number } {
		const rect = this.signatureCanvas.getBoundingClientRect();
		if (event instanceof MouseEvent) {
			return {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			};
		} else {
			const touch = event.touches[0];
			return {
				x: touch.clientX - rect.left,
				y: touch.clientY - rect.top
			};
		}
	}

	startDrawing(event: MouseEvent | TouchEvent) {
		this.isDrawing = true;
		const coords = this.getCoordinates(event);
		this.signatureContext.beginPath();
		this.signatureContext.moveTo(coords.x, coords.y);
	}

	draw(event: MouseEvent | TouchEvent) {
		if (!this.isDrawing) return;
		const coords = this.getCoordinates(event);
		this.signatureContext.lineTo(coords.x, coords.y);
		this.signatureContext.stroke();
	}

	stopDrawing() {
		if (this.isDrawing) {
			this.isDrawing = false;
			this.signatureContext.closePath();
		}
	}

	clearSignature() {
		if (!this.signatureCanvas || !this.signatureContext) return;
		this.signatureContext.clearRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
		this.signatureData = '';
		this.hasSigned = false;
	}

	saveSignature() {
		if (!this.signatureCanvas) return;
		
		// Convertir el canvas a imagen base64
		this.signatureData = this.signatureCanvas.toDataURL('image/png');
		this.hasSigned = true;
		this.closeSignatureModal();
		console.log('Firma guardada correctamente');
	}
  }
  