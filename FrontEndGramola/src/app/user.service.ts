import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = ' http://localhost:8080';

  constructor(private http: HttpClient) {}

  register(email : string, pwd1 : string, pwd2 : string) {
	let registerURL : string = this.apiUrl + '/users/register';
    let info = {
      email : email,
      pwd : pwd1, 
      pwd2 : pwd2
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
	return this.http.post<any>(this.apiUrl, info);
  }
}
