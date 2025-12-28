import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {
  

  private readonly EMAIL_KEY = 'userEmail';
  private readonly ACCESS_KEY = 'clientId';
  private readonly PRIVATE_KEY = 'clientSecret';
  private readonly PREMIUM_KEY = 'isPremiumUser';

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

  setPremiumStatus(isPremium: boolean): void {
    sessionStorage.setItem(this.PREMIUM_KEY, JSON.stringify(isPremium));
  }

  getPremiumStatus(): boolean {
    const status = sessionStorage.getItem(this.PREMIUM_KEY);
    return status ? JSON.parse(status) : false;
  }

  setSpotifyCredentials(clientId: string, clientSecret: string): void {
    this.setAccessToken(clientId);
    this.setPrivateToken(clientSecret);
  }

  setItem(key: string, value: any): void {
    sessionStorage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }
}