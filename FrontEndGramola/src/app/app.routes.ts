import { RouterModule, Routes } from '@angular/router';
import { Registro } from './registro/registro';
import { LoginForm } from './login/login';
import { MainMenu } from './main-menu/main-menu';
import { Gramola } from './gramola/gramola';
import { CallbackComponent } from './callback/callback';
import { Payments } from './payments/payments';
import { EditarPerfil } from './editar-perfil/editar-perfil';
import { NgModule } from '@angular/core';

export const routes: Routes = [
	{ path: '', component: MainMenu },
	{ path: 'login', component: LoginForm },
	{ path: 'register', component: Registro },
	{ path: 'gramola', component: Gramola },
	{ path: 'callback', component: CallbackComponent },
	{ path: 'payments', component: Payments },
	{ path: 'editar-perfil', component: EditarPerfil }

];
