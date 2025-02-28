import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private selectedItemSource = new BehaviorSubject<any>(null);
  selectedItem$ = this.selectedItemSource.asObservable();

  selectItem(item: any) {
    this.selectedItemSource.next(item);
  }
}
