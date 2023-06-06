import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import { SVGEnum } from './common/enums/svg.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public SVGEnum = SVGEnum;
  showPopup = false;
  popupPage = 0;

  constructor (public router: Router) {

  }

  ngOnInit() {

  }

  goToLogin() {
    this.router.navigate(['/account/login']);
  }

  goToRegister() {
    this.router.navigate(['/account/register']);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  openPopup() {
    this.popupPage = 0;
    this.showPopup = true;
  }

  openPopupValidation() {
    this.popupPage = 1;
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }
}
