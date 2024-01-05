import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

export interface ITestItem {
    name: string,
    lat: number,
    lng: number
}

@Injectable()
export class FirebaseService {
    public bobcat: Observable<any>

    constructor(public db: AngularFireDatabase) {

    }

    connectToDatabase() {
        this.bobcat = this.db.object('bobcat').valueChanges()
    }

    syncBobcat(lat: number, lng: number) {
      const item: ITestItem = {
        name: 'bobcat-position',
        lat: lat,
        lng: lng
      }
      this.db.object('bobcat').set(item)
    }
}
