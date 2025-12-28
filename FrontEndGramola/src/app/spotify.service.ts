import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  
  authorizeUrl = 'https://accounts.spotify.com/authorize';
  redirectUrl = 'http://127.0.0.1:4200/callback';
  tokenUrl = 'https://accounts.spotify.com/api/token';
  
  scopes: string[] = [
    "user-read-private", 
    "user-read-email", 
    "playlist-read-private", 
    "playlist-read-collaborative", 
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-playback-state", 
    "user-modify-playback-state", 
    "user-read-currently-playing", 
    "user-library-read", 
    "user-library-modify", 
    "user-read-recently-played", 
    "user-top-read", 
    "app-remote-control", 
    "streaming"
  ];

  constructor(private http: HttpClient) { }

  // Generar string aleatorio para el state
  private generateString(): string {
    const length = 16;
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  // Flujo 1: Solicitar permisos a Spotify
  getToken() {
    let state = this.generateString();

    let params = "response_type=code";
    params += `&client_id=${sessionStorage.getItem("clientId")}`;
    params += `&scope=${encodeURIComponent(this.scopes.join(" "))}`;
    params += `&redirect_uri=${this.redirectUrl}`;
    params += `&state=${state}`;

    sessionStorage.setItem("oauth_state", state);
    let url = this.authorizeUrl + "?" + params;
    window.location.href = url;
  }

  // Flujo 2: Intercambiar código por access token
  getAccessToken(code: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', this.redirectUrl);
    
    const clientId = sessionStorage.getItem('clientId') || '';
    const clientSecret = sessionStorage.getItem('clientSecret') || '';
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    });

    return this.http.post(this.tokenUrl, body.toString(), { headers });
  }

  // Obtener playlists del usuario
  getUserPlaylists(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    
    return this.http.get('https://api.spotify.com/v1/me/playlists', { headers });
  }

  // Refrescar el access token
  refreshAccessToken(refreshToken: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);
    
    const clientId = sessionStorage.getItem('clientId') || '';
    const clientSecret = sessionStorage.getItem('clientSecret') || '';
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    });

    return this.http.post(this.tokenUrl, body.toString(), { headers });
  }

  // Obtener dispositivos disponibles
  getDevices(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    return this.http.get('https://api.spotify.com/v1/me/player/devices', { headers });
  }

  // Activar un dispositivo
  activateDevice(accessToken: string, deviceId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    const body = {
      device_ids: [deviceId],
      play: false
    };
    return this.http.put('https://api.spotify.com/v1/me/player', body, { headers });
  }

  // Obtener canciones de una playlist
  getPlaylistTracks(accessToken: string, playlistId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    return this.http.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
  }

  // Iniciar reproducción
  startPlayback(accessToken: string, playlistId: string, deviceId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    const body = {
      context_uri: `spotify:playlist:${playlistId}`,
      device_id: deviceId
    };
    return this.http.put('https://api.spotify.com/v1/me/player/play', body, { headers });
  }

  // Obtener reproducción actual
  getCurrentPlayback(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    return this.http.get('https://api.spotify.com/v1/me/player/currently-playing', { headers });
  }

  // Buscar canciones
  searchTracks(accessToken: string, query: string, limit: number = 20): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=${limit}`;
    return this.http.get(url, { headers });
  }

  // Agregar canción a playlist
  addTrackToPlaylist(accessToken: string, playlistId: string, trackUri: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    const body = {
      uris: [trackUri]
    };
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    return this.http.post(url, body, { headers });
  }
}
