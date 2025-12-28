import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionStorageService } from '../sessionstorage.service';
import { SpotifyService } from '../spotify.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-gramola',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './gramola.html',
  styleUrls: ['./gramola.css']
})
export class Gramola implements OnInit, OnDestroy {
  // Control de pasos
  currentStep: number = 1; // 1: Playlists, 2: Dispositivos, 3: Canciones
  
  // Datos
  playlists: any[] = [];
  selectedPlaylist: any = null;
  devices: any[] = [];
  selectedDevice: any = null;
  playlistTracks: any[] = [];
  accessToken: string = '';
  searchTerm = '';
  searchResults: any[] = [];
  isSearching: boolean = false;
  showModal = false;
  currentlyPlayingTrack: any = null;
  private playbackCheckInterval: any = null;

  // Subject para búsqueda en tiempo real
  private searchTerms = new Subject<string>();

  constructor(
    private http: HttpClient,
    private sessionStorageService: SessionStorageService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit() {
    // Verificar si existen las credenciales de Spotify
    const clientId = sessionStorage.getItem('clientId');
    const clientSecret = sessionStorage.getItem('clientSecret');
    
    if (!clientId || !clientSecret) {
      console.error('No hay credenciales de Spotify configuradas');
      alert('Por favor, registra tus claves de Spotify primero.');
      return;
    }

    // Obtener el token de acceso de Spotify desde session storage
    const token = this.sessionStorageService.getAccessToken();
    console.log('Token de acceso recuperado:', token);
    
    if (token) {
      // Verificar si el token sigue siendo válido intentando cargar playlists
      this.accessToken = token;
      this.loadUserPlaylists();
    } else {
      // No hay token, iniciar flujo OAuth
      console.log('No hay token de Spotify, iniciando flujo OAuth...');
      this.spotifyService.getToken();
    }

    // Configurar búsqueda en tiempo real con debounce
    this.searchTerms.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      if (term && term.trim().length > 0) {
        this.performSearch(term);
      } else {
        this.searchResults = [];
      }
    });
  }

  loadUserPlaylists() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`
    });

    console.log('Intentando cargar playlists con token:', this.accessToken.substring(0, 20) + '...');

    this.http.get('https://api.spotify.com/v1/me/playlists', { headers })
      .subscribe({
        next: (response: any) => {
          this.playlists = response.items;
          console.log('Playlists cargadas:', this.playlists);
          
          // Cargar playlist guardada si existe
          const savedPlaylistId = sessionStorage.getItem('selectedPlaylistId');
          if (savedPlaylistId) {
            const savedPlaylist = this.playlists.find(p => p.id === savedPlaylistId);
            if (savedPlaylist) {
              this.selectPlaylist(savedPlaylist);
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar playlists:', error);
          if (error.status === 401) {
            console.log('Token expirado o inválido, reiniciando flujo OAuth...');
            // Token expirado o inválido, reiniciar OAuth
            sessionStorage.removeItem('spotifyAccessToken');
            this.spotifyService.getToken();
          }
        }
      });
  }

  selectPlaylist(playlist: any) {
    this.selectedPlaylist = playlist;
    sessionStorage.setItem('selectedPlaylistId', playlist.id);
    sessionStorage.setItem('selectedPlaylistName', playlist.name);
    console.log('Playlist seleccionada:', playlist.name);
    
    // Avanzar al paso 2: selección de dispositivo
    this.currentStep = 2;
    this.loadDevices();
  }

  loadDevices() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`
    });

    console.log('Cargando dispositivos disponibles...');

    this.http.get('https://api.spotify.com/v1/me/player/devices', { headers })
      .subscribe({
        next: (response: any) => {
          this.devices = response.devices;
          console.log('Dispositivos cargados:', this.devices);
          
          if (this.devices.length === 0) {
            alert('No se encontraron dispositivos activos. Abre Spotify en tu móvil, ordenador o navegador web.');
          }
        },
        error: (error) => {
          console.error('Error al cargar dispositivos:', error);
          alert('Error al obtener dispositivos. Asegúrate de tener Spotify abierto en algún dispositivo.');
        }
      });
  }

  selectDevice(device: any) {
    this.selectedDevice = device;
    sessionStorage.setItem('selectedDeviceId', device.id);
    sessionStorage.setItem('selectedDeviceName', device.name);
    console.log('Dispositivo seleccionado:', device.name);
    
    // Avanzar al paso 3: mostrar canciones y comenzar reproducción
    this.currentStep = 3;
    this.loadPlaylistTracks(this.selectedPlaylist.id, true);
  }

  loadPlaylistTracks(playlistId: string, startPlayback: boolean = false) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`
    });

    this.http.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers })
      .subscribe({
        next: (response: any) => {
          this.playlistTracks = response.items;
          console.log('Canciones cargadas:', this.playlistTracks.length);
          
          // Comenzar reproducción solo si se indica explícitamente
          if (startPlayback) {
            this.startPlayback();
          }
          
          // Iniciar polling del estado de reproducción
          this.startPlaybackPolling();
        },
        error: (error) => {
          console.error('Error al cargar canciones:', error);
        }
      });
  }

  startPlayback() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

    const body = {
      context_uri: `spotify:playlist:${this.selectedPlaylist.id}`,
      device_id: this.selectedDevice.id
    };

    console.log('Iniciando reproducción en:', this.selectedDevice.name);

    this.http.put('https://api.spotify.com/v1/me/player/play', body, { headers })
      .subscribe({
        next: () => {
          console.log('Reproducción iniciada correctamente');
        },
        error: (error) => {
          console.error('Error al iniciar reproducción:', error);
          if (error.status === 404) {
            alert('Dispositivo no encontrado. Por favor, selecciona otro dispositivo.');
          } else {
            alert('Error al iniciar reproducción. Asegúrate de que Spotify está activo en el dispositivo seleccionado.');
          }
        }
      });
  }

  startPlaybackPolling() {
    // Limpiar cualquier intervalo previo
    if (this.playbackCheckInterval) {
      clearInterval(this.playbackCheckInterval);
    }

    // Obtener estado inicial
    this.getCurrentPlayback();

    // Actualizar cada 3 segundos
    this.playbackCheckInterval = setInterval(() => {
      this.getCurrentPlayback();
    }, 3000);
  }

  getCurrentPlayback() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`
    });

    this.http.get('https://api.spotify.com/v1/me/player/currently-playing', { headers })
      .subscribe({
        next: (response: any) => {
          if (response && response.item) {
            this.currentlyPlayingTrack = response.item;
          } else {
            this.currentlyPlayingTrack = null;
          }
        },
        error: (error) => {
          // No hacer nada si no hay reproducción activa
          if (error.status === 204) {
            this.currentlyPlayingTrack = null;
          }
        }
      });
  }

  isTrackPlaying(track: any): boolean {
    if (!this.currentlyPlayingTrack || !track) {
      return false;
    }
    return this.currentlyPlayingTrack.id === track.id;
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.searchTerm = '';
    this.searchResults = [];
  }

  onSearchChange(term: string) {
    this.searchTerms.next(term);
  }

  performSearch(term: string) {
    this.isSearching = true;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`
    });

    // Buscar canciones y artistas
    const query = encodeURIComponent(term);
    const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=20`;

    this.http.get(url, { headers })
      .subscribe({
        next: (response: any) => {
          this.searchResults = response.tracks.items;
          this.isSearching = false;
          console.log('Resultados de búsqueda:', this.searchResults.length);
        },
        error: (error) => {
          console.error('Error en la búsqueda:', error);
          this.isSearching = false;
        }
      });
  }

  addToQueue(track: any) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

    const url = `https://api.spotify.com/v1/playlists/${this.selectedPlaylist.id}/tracks`;
    const body = {
      uris: [track.uri]
    };

    this.http.post(url, body, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Canción agregada a la playlist:', track.name);
          alert(`"${track.name}" agregada a la playlist "${this.selectedPlaylist.name}"`);
          
          // Recargar las canciones de la playlist para mostrar la nueva (sin reiniciar reproducción)
          this.loadPlaylistTracks(this.selectedPlaylist.id, false);
          this.closeModal();
        },
        error: (error) => {
          console.error('Error al agregar a la playlist:', error);
          if (error.status === 403) {
            alert('No tienes permisos para modificar esta playlist. Solo puedes editar tus propias playlists.');
          } else {
            alert('Error al agregar la canción a la playlist.');
          }
        }
      });
  }

  // Formatear duración de milisegundos a mm:ss
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.searchTerms.complete();
    
    // Limpiar intervalo de polling
    if (this.playbackCheckInterval) {
      clearInterval(this.playbackCheckInterval);
    }
  }
}