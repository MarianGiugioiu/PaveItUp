import { Directive, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  selector: '[lastElementInView]'
})
export class LastElementInViewDirective {
  @Output() lastElementInView: EventEmitter<any> = new EventEmitter();

  constructor() {}

  @HostListener('scroll', ['$event.target'])
  onScroll(target: HTMLElement) {
    const scrollPosition = target.scrollTop + target.offsetHeight;
    const containerHeight = target.scrollHeight;
    
    if (scrollPosition >= containerHeight) {
      this.lastElementInView.emit();
    }
  }
}