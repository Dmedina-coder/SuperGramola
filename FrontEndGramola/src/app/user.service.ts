import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  register(
    email: string, 
    pwd1: string, 
    pwd2: string, 
    accessToken?: string, 
    privateToken?: string,
    nombreBar?: string,
    ubicacionBar?: string,
    costeCancion?: number
  ) {
	let registerURL : string = this.apiUrl + '/users/register';
    let info: any = {
      email : email,
      pwd : pwd1, 
      pwd2 : pwd2
    };
    
    // Añadir credenciales de Spotify si están presentes
    if (accessToken) {
      info.accessToken = accessToken;
    }
    if (privateToken) {
      info.privateToken = privateToken;
    }
    
    // Añadir información del bar
    if (nombreBar) {
      info.nombreBar = nombreBar;
    }
    if (ubicacionBar) {
      info.ubicacionBar = ubicacionBar;
    }
    if (costeCancion !== undefined) {
      info.costeCancion = costeCancion;
    }
    
    return this.http.post<any>(registerURL, info);
  }

  registerSpotify(email : string, access : string, secret : string) {
	let APIregisterURL : string = this.apiUrl + '/users/setAPITokens';
	let info = {
	  email : email,
	  accessToken : access, 
	  privateToken : secret
	}
  return this.http.post<any>(APIregisterURL, info);
  }

  login(email : string, pwd : string) {
	let loginURL : string = this.apiUrl + '/users/login';
	let info = {
	  email : email,
	  pwd : pwd
	}
	return this.http.post<any>(loginURL, info);
  }

  getSpotifyAccessToken(email: string) {
  const url = `${this.apiUrl}/users/${email}/spotify/access`;
  return this.http.get(url, { responseType: 'text' });
  }

  getSpotifyPrivateToken(email: string) {
  const url = `${this.apiUrl}/users/${email}/spotify/private`;
  return this.http.get(url, { responseType: 'text' });
  }

  hasActiveSubscription(email: string) {
    const url = `${this.apiUrl}/users/${email}/subscription/active`;
    return this.http.get<boolean>(url);
  }

  getCosteCancion(email: string) {
    const url = `${this.apiUrl}/users/${email}/coste-cancion`;
    return this.http.get<number>(url);
  }

  setCosteCancion(email: string, costeCancion: number) {
    const url = `${this.apiUrl}/users/${email}/coste-cancion`;
    return this.http.put<any>(url, { costeCancion });
  }

  isActive(email: string) {
    const url = `${this.apiUrl}/users/${email}/is-active`;
    return this.http.get<boolean>(url);
  }

  deleteAccount(email: string) {
    const url = `${this.apiUrl}/users/delete`;
    return this.http.delete<any>(url, { body: { email: email } });
  }

  getBarData(email: string) {
    const url = `${this.apiUrl}/users/${email}/bar-data`;
    return this.http.get<{nombreBar?: string, ubicacionBar?: string}>(url);
  }

  setBarData(email: string, nombreBar: string, ubicacionBar: string) {
    const url = `${this.apiUrl}/users/${email}/bar-data`;
    const barData = {
      nombreBar: nombreBar,
      ubicacionBar: ubicacionBar
    };
    return this.http.put<any>(url, barData);
  }

  activateAccount(email: string, token: string) {
    const url = `${this.apiUrl}/users/activate/${email}?token=${token}`;
    return this.http.get<any>(url);
  }
}
