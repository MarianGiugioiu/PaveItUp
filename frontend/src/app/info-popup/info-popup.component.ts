import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { SVGEnum } from '../common/enums/svg.enum';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-popup.component.html',
  styleUrls: ['./info-popup.component.scss']
})
export class InfoPopupComponent {
  @Input('showPopup') showPopup: boolean;
  @Output() closePopupEvent = new EventEmitter();
  public page = false;

  public SVGEnum = SVGEnum;

  changePage(value) {
    this.page = value;
  }
  
  closePopup() {
    this.closePopupEvent.emit();
  }
}
