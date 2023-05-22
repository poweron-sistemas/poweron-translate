import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { POTMenuBehavior } from '../models/menu.behavior';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private subject: Subject<POTMenuBehavior> = new Subject();

  public handle(type: POTMenuBehavior['type'], id: string | string[], value?: any): void {
    this.subject.next({ type, id, value });
  }

  public observeBehavior(): Observable<POTMenuBehavior> {
    return this.subject.asObservable();
  }
}
