import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import { SVGEnum } from './common/enums/svg.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public SVGEnum = SVGEnum;
  
  constructor () {

  }

  ngOnInit() {
  }
}
