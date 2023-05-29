import { Injectable } from '@angular/core';
import * as THREE from 'three';

export interface ITextures {
  surface: any[];
  shape: any[];
}

@Injectable({
  providedIn: 'root'
})
export class TextureService {
  public textures: ITextures;
  public surfaceTextureOptions: string[];
  public shapeTextureOptions: string[];
  textureLoader: THREE.TextureLoader;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {
      surface: [],
      shape: []
    };
    this.surfaceTextureOptions = ['Sand', 'Cement'];
    this.shapeTextureOptions = ['Classic', 'Advanced'];
    this.textures.surface.push(this.textureLoader.load('https://images.unsplash.com/photo-1608538620576-7c9095a91b90?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'));
    this.textures.surface.push(this.textureLoader.load('https://images.unsplash.com/photo-1560780552-ba54683cb263?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'));
    this.textures.shape.push(this.textureLoader.load('https://images.unsplash.com/photo-1536566482680-fca31930a0bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'));
    this.textures.shape.push(this.textureLoader.load('https://images.unsplash.com/photo-1591753177862-0e8c4b07fc5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80'));
  }
}
