import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  constructor() { }

  findSmallestNumberNotInList(numbers) {
    numbers.sort((a, b) => a - b);

    let smallestNumber = 1;
  
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] <= smallestNumber) {
        smallestNumber = numbers[i] + 1;
      } else {
        break;
      }
    }
  
    return smallestNumber;
  }
}
