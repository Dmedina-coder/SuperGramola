import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gramola',
  imports: [FormsModule, CommonModule],
  templateUrl: './gramola.html',
  styleUrls: ['./gramola.css']
})
export class Gramola {
  playlist = [
    { title: 'Canción 1', artist: 'Artista A' },
    { title: 'Canción 2', artist: 'Artista B' },
    { title: 'Canción 3', artist: 'Artista C' }
  ];

  searchTerm = '';
  searchResults: { title: string; artist: string }[] = [];
  showModal = false;

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.searchTerm = '';
    this.searchResults = [];
  }

  searchSongs() {
    // Simulación de resultados
    this.searchResults = [
      { title: 'Resultado 1', artist: 'Artista X' },
      { title: 'Resultado 2', artist: 'Artista Y' }
    ];
  }
}