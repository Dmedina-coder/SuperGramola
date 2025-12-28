import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionStorageService } from '../sessionstorage.service';

@Component({
  selector: 'app-main-menu',
  imports: [CommonModule],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.css'
})
export class MainMenu implements OnInit {
  userEmail: string | null = null;

	constructor(
    private router: Router,
    private sessionStorageService: SessionStorageService
  ) {}

  ngOnInit() {
    this.userEmail = this.sessionStorageService.getEmail();
  }

	goToRegister() {
		this.router.navigate(['/register']);
	}

	goToLogin() {
		this.router.navigate(['/login']);
	}

  goToGramola() {
    this.router.navigate(['/gramola']);
  }

  goToModifyUser() {
    this.router.navigate(['/modify-user']);
  }

  logout() {
    // Limpiar session storage
    sessionStorage.clear();
    this.userEmail = null;
    console.log('Sesión cerrada');
    // Recargar el componente
    this.router.navigate(['/']);
  }
}
