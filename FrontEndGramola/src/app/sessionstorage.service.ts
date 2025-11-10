import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  private readonly EMAIL_KEY = 'userEmail';

  setEmail(email: string): void {
    sessionStorage.setItem(this.EMAIL_KEY, email);
  }

  getEmail(): string | null {
    return sessionStorage.getItem(this.EMAIL_KEY);
  }

  removeEmail(): void {
    sessionStorage.removeItem(this.EMAIL_KEY);
  }

  clearAll(): void {
    sessionStorage.clear();
  }
}