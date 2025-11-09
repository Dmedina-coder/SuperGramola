import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class LoginForm {
	loginForm : FormGroup;
	email? : string
	pwd? : string

	constructor(private formBuilder : FormBuilder) {
		this.loginForm = this.formBuilder.group({
			email: ['', Validators.required, Validators.email],
			pwd: ['', Validators.required, Validators.minLength(8)]
		});
	}

	onSubmit() {
		console.log(this.loginForm.value);
	}
}
