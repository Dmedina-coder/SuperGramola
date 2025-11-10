import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../user.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-spotify-api',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './spotify-api.html',
	styleUrl: './spotify-api.css'
})
export class SpotifyAPI {
	email: string | null = null;

	access? : string
	secret? : string

	APIinvalida : boolean = false

	constructor(private service : UserService, private router: Router) { }
  
	ngOnInit() {
	  // Se ejecuta automáticamente al cargar el componente
	  this.email = sessionStorage.getItem('userEmail');
	}

	registrar() {
	
		this.service.register(this.email!, this.access!, this.secret!).subscribe(
		  ok => {
			console.log('Registro exitoso', ok);
			this.APIinvalida = false;
			alert('Claves almacenadas correctamente.');
			this.router.navigate(['/MainMenu']);
		  },
		  error => {
			console.error('Error en el registro', error);
			this.APIinvalida = true;
		  }
		);
	  }
}
