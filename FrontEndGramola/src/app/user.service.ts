import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  register(email : string, pwd1 : string, pwd2 : string, accessToken?: string, privateToken?: string) {
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
}
