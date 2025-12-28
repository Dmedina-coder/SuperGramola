import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  private readonly EMAIL_KEY = 'userEmail';
  private readonly ACCESS_KEY = 'spotifyAccessToken';
  private readonly PRIVATE_KEY = 'spotifyPrivateToken';

  setEmail(email: string): void {
    sessionStorage.setItem(this.EMAIL_KEY, email);
  }

  getEmail(): string | null {
    return sessionStorage.getItem(this.EMAIL_KEY);
  }

  setAccessToken(token: string): void {
    sessionStorage.setItem(this.ACCESS_KEY, token);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_KEY);
  }

  setPrivateToken(token: string): void {
    sessionStorage.setItem(this.PRIVATE_KEY, token);
  }

  getPrivateToken(): string | null {
    return sessionStorage.getItem(this.PRIVATE_KEY);
  }

  removeEmail(): void {
    sessionStorage.removeItem(this.EMAIL_KEY);
  }

  removeAccessToken(): void {
    sessionStorage.removeItem(this.ACCESS_KEY);
  }

  removePrivateToken(): void {
    sessionStorage.removeItem(this.PRIVATE_KEY);
  }

  clearAll(): void {
    sessionStorage.clear();
  }
}