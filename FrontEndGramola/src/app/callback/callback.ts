import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyService } from '../spotify.service';
import { SessionStorageService } from '../sessionstorage.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <h2>Conectando con Spotify...</h2>
        <p>Por favor espera mientras procesamos tu autenticación.</p>
      </div>
    </div>
  `
})
export class CallbackComponent implements OnInit {
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotifyService: SpotifyService,
    private sessionStorageService: SessionStorageService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];

      // Verificar si hay error
      if (error) {
        console.error('Error en autorización:', error);
        alert('Error al autorizar con Spotify: ' + error);
        this.router.navigate(['/spotify-api']);
        return;
      }

      // Verificar el state (seguridad contra CSRF)
      const savedState = sessionStorage.getItem('oauth_state');
      if (state !== savedState) {
        console.error('State mismatch. Posible ataque CSRF.');
        alert('Error de seguridad en la autenticación.');
        this.router.navigate(['/spotify-api']);
        return;
      }

      // Si tenemos el código, intercambiarlo por tokens
      if (code) {
        this.exchangeCodeForTokens(code);
      } else {
        console.error('No se recibió código de autorización');
        alert('No se pudo completar la autenticación con Spotify');
        this.router.navigate(['/spotify-api']);
      }
    });
  }

  private exchangeCodeForTokens(code: string) {
    this.spotifyService.getAccessToken(code).subscribe({
      next: (response: any) => {
        console.log('Tokens obtenidos exitosamente');
        
        // Guardar tokens en session storage
        this.sessionStorageService.setAccessToken(response.access_token);
        this.sessionStorageService.setPrivateToken(response.refresh_token);
        
        // Guardar tiempo de expiración
        const expiresAt = Date.now() + (response.expires_in * 1000);
        sessionStorage.setItem('spotify_token_expires_at', expiresAt.toString());

        // Redirigir a gramola
        this.router.navigate(['/gramola']);
      },
      error: (error) => {
        console.error('Error al intercambiar código por tokens:', error);
        alert('Error al obtener tokens de Spotify. Intenta de nuevo.');
        this.router.navigate(['/spotify-api']);
      }
    });
  }
}
