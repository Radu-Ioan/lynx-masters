import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, take } from 'rxjs';


export interface Review {
  name: string,
  ratting: number
}

@Injectable()
export class FirebaseService {
    public featureLayers: Observable<any>

    constructor(public db: AngularFireDatabase) {
      this.featureLayers = db.object('feature-layers').valueChanges()
    }

    syncBobcatList(positions: any) {
      this.db.object('bobcats-locations').set(positions)
    }

    createTrailReview(item: Review, trail_name: string) {
      // Retrieve the current data from 'Reviews'
      this.db.object('Reviews').valueChanges().pipe(take(1)).subscribe((reviewsData: any) => {
        // If 'Reviews' doesn't exist or is empty, initialize it as an empty object
        const newReviewsData = reviewsData ? { ...reviewsData } : {};
  
        // Create 'Ceva' array if it doesn't exist
        newReviewsData[trail_name] = newReviewsData[trail_name] ? newReviewsData[trail_name] : [];
  
        // Add the new item to the 'Ceva' array
        newReviewsData[trail_name].push(item);
  
        // Update the 'Reviews' collection with the modified data
        this.db.object('Reviews').set(newReviewsData);
      });
    }

    getReviewsForTrail(trailName: string): Observable<any> {
      return this.db.object(`Reviews/${trailName}`).valueChanges();
    }
}
