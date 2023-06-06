import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { SVGEnum } from '../common/enums/svg.enum';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-popup.component.html',
  styleUrls: ['./info-popup.component.scss']
})
export class InfoPopupComponent {
  @Input('showPopup') showPopup: boolean;
  @Input('popupPage') popupPage: number;
  @Output() closePopupEvent = new EventEmitter();

  public SVGEnum = SVGEnum;

  changePage(value) {
    this.popupPage = value;
  }
  
  closePopup() {
    this.closePopupEvent.emit();
  }
}
