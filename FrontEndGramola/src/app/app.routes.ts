import { RouterModule, Routes } from '@angular/router';
import { Registro } from './registro/registro';
import { LoginForm } from './login/login';
import { MainMenu } from './main-menu/main-menu';
import { Gramola } from './gramola/gramola';
import { NgModule } from '@angular/core';

export const routes: Routes = [
	{ path: '', component: MainMenu },
	{ path: 'login', component: LoginForm },
	{ path: 'register', component: Registro },
	{ path: 'gramola', component: Gramola }

];
