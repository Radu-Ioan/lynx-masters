// review-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';



@Component({
  selector: 'app-review-dialog',
  templateUrl: './review-dialog.component.html',
  styleUrls: ['./review-dialog.component.scss']
})
export class ReviewDialogComponent {
  createRangeArray = (length: number) => Array.from({ length }, (_, index) => index);
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }
}
