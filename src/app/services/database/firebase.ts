import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';


@Injectable()
export class FirebaseService {
    public featureLayers: Observable<any>

    constructor(public db: AngularFireDatabase) {
      this.featureLayers = db.object('feature-layers').valueChanges()
    }

    syncBobcatList(positions: any) {
      this.db.object('bobcats-locations').set(positions)
    }
}
