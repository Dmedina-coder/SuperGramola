import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionStorageService } from '../sessionstorage.service';
import { SpotifyService } from '../spotify.service';
import { UserService } from '../user.service';
import { PaymentService } from '../payment.service';
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
  costeCancion: number = 0;

  // Sistema de bloqueo con PIN
  isLocked: boolean = false;
  showPinModal: boolean = false;
  pinInput: string = '';
  savedPin: string = '';
  pinError: string = '';

  // Verificación de proximidad
  checkingProximity: boolean = true;
  isNearBar: boolean = false;
  proximityError: string = '';
  locationError: string = '';

  // Sistema de pago por canción
  showPaymentModal: boolean = false;
  selectedTrackToPay: any = null;
  paymentProcessing: boolean = false;
  paymentError: string = '';
  cardElement: any = null;
  cardErrors: string = '';

  // Subject para búsqueda en tiempo real
  private searchTerms = new Subject<string>();

  constructor(
    private http: HttpClient,
    private sessionStorageService: SessionStorageService,
    private spotifyService: SpotifyService,
    private userService: UserService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar proximidad primero
    this.checkUserProximity();

    // Obtener email del usuario y coste por canción
    const userEmail = this.sessionStorageService.getEmail();
    if (userEmail) {
      this.userService.getCosteCancion(userEmail).subscribe({
        next: (coste) => {
          this.costeCancion = Math.round(coste) / 100;
          // Stripe requiere un mínimo de 0.50 EUR
          if (this.costeCancion < 0.50) {
            console.warn(`Coste ${this.costeCancion} es menor al mínimo de Stripe. Ajustando a 0.50€`);
            this.costeCancion = 0.50;
          }
          console.log('Coste por canción:', this.costeCancion);
        },
        error: (error) => {
          console.error('Error al obtener coste por canción:', error);
          // Establecer mínimo por defecto si hay error
          this.costeCancion = 0.50;
        }
      });
    }

    // Verificar si existen las credenciales de Spotify
    const clientId = this.sessionStorageService.getAccessToken();
    const clientSecret = this.sessionStorageService.getPrivateToken();
    
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
    console.log('Intentando cargar playlists con token:', this.accessToken.substring(0, 20) + '...');

    this.spotifyService.getUserPlaylists(this.accessToken)
      .subscribe({
        next: (response: any) => {
          this.playlists = response.items;
          console.log('Playlists cargadas:', this.playlists);
          
          // Cargar playlist guardada si existe
          const savedPlaylistId = this.sessionStorageService.getItem('selectedPlaylistId');
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
            this.sessionStorageService.removeItem('spotifyAccessToken');
            this.spotifyService.getToken();
          }
        }
      });
  }

  selectPlaylist(playlist: any) {
    this.selectedPlaylist = playlist;
    this.sessionStorageService.setItem('selectedPlaylistId', playlist.id);
    this.sessionStorageService.setItem('selectedPlaylistName', playlist.name);
    console.log('Playlist seleccionada:', playlist.name);
    
    // Avanzar al paso 2: selección de dispositivo
    this.currentStep = 2;
    this.loadDevices();
  }

  loadDevices() {
    console.log('Cargando dispositivos disponibles...');

    this.spotifyService.getDevices(this.accessToken)
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
    this.sessionStorageService.setItem('selectedDeviceId', device.id);
    this.sessionStorageService.setItem('selectedDeviceName', device.name);
    console.log('Dispositivo seleccionado:', device.name);
    
    // Transferir reproducción al dispositivo seleccionado (activarlo)
    console.log('Activando dispositivo:', device.name);

    this.spotifyService.activateDevice(this.accessToken, device.id)
      .subscribe({
        next: () => {
          console.log('Dispositivo activado correctamente');
          // Avanzar al paso 3: mostrar canciones y comenzar reproducción
          this.currentStep = 3;
          this.loadPlaylistTracks(this.selectedPlaylist.id, true);
        },
        error: (error) => {
          console.error('Error al activar dispositivo:', error);
          // Continuar de todas formas, puede que el dispositivo ya esté activo
          this.currentStep = 3;
          this.loadPlaylistTracks(this.selectedPlaylist.id, true);
        }
      });
  }

  loadPlaylistTracks(playlistId: string, startPlayback: boolean = false) {
    this.spotifyService.getPlaylistTracks(this.accessToken, playlistId)
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
    console.log('Iniciando reproducción en:', this.selectedDevice.name);

    this.spotifyService.startPlayback(this.accessToken, this.selectedPlaylist.id, this.selectedDevice.id)
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
    this.spotifyService.getCurrentPlayback(this.accessToken)
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

    this.spotifyService.searchTracks(this.accessToken, term, 20)
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
    // Verificar si hay que cobrar por la canción
    if (this.costeCancion > 0) {
      this.selectedTrackToPay = track;
      this.showPaymentModal = true;
      this.paymentError = '';
      this.cardErrors = '';
      
      // Desmontar Card Element anterior si existe
      if (this.cardElement) {
        this.cardElement.unmount();
        this.cardElement = null;
      }
      
      // Inicializar Stripe Card Element después de que el modal se renderice
      setTimeout(() => {
        this.initializeCardElement();
      }, 500);
      return;
    }

    // Si el coste es 0, agregar directamente
    this.processAddToQueue(track);
  }

  processAddToQueue(track: any) {
    this.spotifyService.addTrackToPlaylist(this.accessToken, this.selectedPlaylist.id, track.uri)
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

  // Modal de pago
  initializeCardElement() {
    
    if (!this.paymentService.isStripeAvailable()) {
      console.error('Stripe no está disponible');
      this.paymentError = 'Stripe no está disponible. Por favor, recarga la página.';
      return;
    }

    try {
      // Verificar que el contenedor existe
      const cardContainer = document.getElementById('song-card-element');
      
      if (!cardContainer) {
        console.error('Contenedor de tarjeta no encontrado en el DOM');
        this.paymentError = 'Error al cargar el formulario de pago';
        return;
      }

      console.log('Dimensiones del contenedor:', {
        width: cardContainer.offsetWidth,
        height: cardContainer.offsetHeight,
        display: window.getComputedStyle(cardContainer).display
      });
      
      // Crear Card Element
      this.cardElement = this.paymentService.createCardElement();
      
      // Montar el Card Element en el DOM
      this.cardElement.mount('#song-card-element');
      
      // Escuchar cambios en el Card Element
      this.cardElement.on('change', (event: any) => {
        if (event.error) {
          this.cardErrors = event.error.message;
        } else {
          this.cardErrors = '';
        }
      });

      this.cardElement.on('ready', () => {
      });
    } catch (error) {
      console.error('Error al inicializar Card Element:', error);
      this.paymentError = 'Error al inicializar el formulario de pago';
    }
  }

  closePaymentModal() {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement = null;
    }
    this.showPaymentModal = false;
    this.selectedTrackToPay = null;
    this.paymentError = '';
    this.cardErrors = '';
    
    // Destruir Card Element
    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
  }

  confirmPayment() {
    if (!this.selectedTrackToPay) return;

    const userEmail = this.sessionStorageService.getEmail();
    if (!userEmail) {
      this.paymentError = 'No se pudo obtener el email del usuario';
      return;
    }

    if (!this.cardElement) {
      this.paymentError = 'Error: Formulario de pago no inicializado';
      return;
    }

    this.paymentProcessing = true;
    this.paymentError = '';
    this.cardErrors = '';

    // Preparar el pago con Stripe
    this.paymentService.prepareSongPayment(userEmail, this.costeCancion).subscribe({
      next: (transactionDetails) => {
        
        const clientSecret = transactionDetails.clientSecret;
        const transactionId = transactionDetails.transactionId;
        let paymentIntentId = transactionDetails.paymentIntentId;

        if (!clientSecret) {
          this.paymentError = 'Error al preparar el pago';
          this.paymentProcessing = false;
          return;
        }

        // Confirmar pago con Stripe usando Card Element
        this.paymentService.confirmCardPayment(
          clientSecret,
          this.cardElement,
          userEmail,
          userEmail
        )
          .then((result) => {
            if (result.error) {
              // Error al procesar el pago
              console.error('Error en Stripe:', result.error.message);
              this.paymentError = result.error.message;
              this.paymentProcessing = false;
            } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
              // Obtener el paymentIntentId del resultado de Stripe (más confiable)
              const stripePaymentIntentId = result.paymentIntent.id;
              
              // Usar el ID de Stripe en lugar del que viene del backend
              const finalPaymentIntentId = stripePaymentIntentId || paymentIntentId;
              
              const confirmData = {
                email: userEmail,
                paymentIntentId: finalPaymentIntentId,
                amount: this.costeCancion,
                transactionId: transactionId,
                trackUri: this.selectedTrackToPay.uri
              };
              
              this.paymentService.confirmSongPaymentInBackend(
                userEmail,
                finalPaymentIntentId,
                this.costeCancion,
                transactionId,
                this.selectedTrackToPay.uri
              ).subscribe({
                next: () => {
                  console.log(`Pago de ${this.costeCancion.toFixed(2)}€ procesado correctamente`);
                  this.paymentProcessing = false;
                  
                  // Pago exitoso, agregar canción
                  this.processAddToQueue(this.selectedTrackToPay);
                  this.closePaymentModal();
                },
                error: (error) => {
                  console.error('Datos enviados:', confirmData);
                  console.error('Error detallado:', error.error);
                  
                  // Mostrar información detallada del error
                  let errorMsg = 'Error al confirmar el pago en el servidor.';
                  if (error.error && error.error.message) {
                    errorMsg += '\n' + error.error.message;
                  }
                  alert(errorMsg + '\n\nVerifica la consola del backend y asegúrate de que el endpoint /payments/confirm-song está implementado.');
                  
                  this.paymentError = 'Error al confirmar el pago';
                  this.paymentProcessing = false;
                }
              });
            }
          })
          .catch((error) => {
            console.error('Error en el proceso de pago:', error);
            this.paymentError = 'Error al procesar el pago';
            this.paymentProcessing = false;
          });
      },
      error: (error) => {
        console.error('Error al preparar pago:', error);
        this.paymentError = 'Error al preparar el pago';
        this.paymentProcessing = false;
      }
    });
  }

  // Formatear duración de milisegundos a mm:ss
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Sistema de bloqueo con PIN
  toggleLock() {
    this.showPinModal = true;
    this.pinInput = '';
    this.pinError = '';
  }

  checkUserProximity() {
    const userEmail = this.sessionStorageService.getEmail();
    
    if (!userEmail) {
      this.proximityError = 'No se pudo obtener el email del usuario';
      this.checkingProximity = false;
      return;
    }

    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      this.locationError = 'Tu navegador no soporta geolocalización';
      this.checkingProximity = false;
      alert('Tu navegador no soporta geolocalización. Por favor, actualiza tu navegador.');
      return;
    }

    // Obtener ubicación actual del usuario
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitud = position.coords.latitude;
        const longitud = position.coords.longitude;
        
        console.log('Ubicación actual:', { latitud, longitud });

        // Verificar proximidad con el backend
        this.userService.checkProximity(userEmail, latitud, longitud).subscribe({
          next: (response) => {
            this.isNearBar = response.estaCerca;
            this.checkingProximity = false;
            
            if (!this.isNearBar) {
              this.proximityError = response.mensaje || 'Estás demasiado lejos del bar';
            } else {
              console.log('✓ Usuario está dentro del rango permitido');
            }
          },
          error: (error) => {
            console.error('Error al verificar proximidad:', error);
            this.checkingProximity = false;
            
            if (error.status === 404 && error.error?.message?.includes('coordenadas')) {
              this.proximityError = 'El bar no tiene coordenadas registradas';
            } else {
              this.proximityError = 'Error al verificar la ubicación';
            }
          }
        });
      },
      (error) => {
        this.checkingProximity = false;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            this.locationError = 'Tiempo de espera agotado';
            break;
          default:
            this.locationError = 'Error desconocido al obtener ubicación';
            break;
        }
        
        console.error('Error de geolocalización:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  // Bypass para presentaciones
  bypassProximityCheck() {
    console.log('⚠️ MODO PRESENTACIÓN: Omitiendo verificación de proximidad');
    this.isNearBar = true;
    this.proximityError = '';
    this.locationError = '';
    this.checkingProximity = false;
  }

  // Sistema de bloqueo con PIN

  closePinModal() {
    this.showPinModal = false;
    this.pinInput = '';
    this.pinError = '';
  }

  onPinInput(event: any) {
    const value = event.target.value;
    // Solo permitir números y máximo 4 dígitos
    this.pinInput = value.replace(/\D/g, '').slice(0, 4);
    event.target.value = this.pinInput;
    this.pinError = '';
  }

  confirmPin() {
    if (this.pinInput.length !== 4) {
      this.pinError = 'El PIN debe tener 4 dígitos';
      return;
    }

    if (!this.isLocked) {
      // Bloquear: guardar el PIN
      this.savedPin = this.pinInput;
      this.isLocked = true;
      this.closePinModal();
      console.log('Aplicación bloqueada');
    } else {
      // Desbloquear: verificar el PIN
      if (this.pinInput === this.savedPin) {
        this.isLocked = false;
        this.savedPin = '';
        this.closePinModal();
        console.log('Aplicación desbloqueada');
      } else {
        this.pinError = 'PIN incorrecto';
        this.pinInput = '';
      }
    }
  }

  ngOnDestroy() {
    this.searchTerms.complete();
    
    // Limpiar intervalo de polling
    if (this.playbackCheckInterval) {
      clearInterval(this.playbackCheckInterval);
    }
  }
}