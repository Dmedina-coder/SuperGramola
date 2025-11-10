import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { SessionStorageService } from '../sessionstorage.service';


@Component({
	selector: 'app-registro',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './registro.html',
	styleUrl: './registro.css'
  })
  export class Registro {
  
	email? : string
	pwd1? : string
	pwd2? : string

	registroOK : boolean = false
	pwdDiferentes : boolean = false
	emailInvalido : boolean = false
  
	constructor(private service : UserService, private session : SessionStorageService, private router: Router) { }
  
	registrar() {
	  if (this.pwd1 != this.pwd2) {
		console.error('Las contraseñas no coinciden');
		this.pwdDiferentes = true;
		return;
	  }

	  if (!this.email || !this.email.includes('@')) {
		console.error('El email es inválido');
		this.emailInvalido = true;
		return;
	  }
  
	  this.service.register(this.email!, this.pwd1!, this.pwd2!).subscribe(
		ok => {
			console.log('Registro exitoso', ok);
			this.pwdDiferentes = false;
			this.emailInvalido = false;
			this.session.setEmail(this.email!);
			alert('Registro exitoso. Revisa su correo electronico para activar su cuenta.');
			this.router.navigate(['/MainMenu']);
		},
		error => {
			console.error('Error en el registro', error);
			this.registroOK = false;
		}
	  );
	}
  }
  