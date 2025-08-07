import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, doc, updateDoc, addDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-trips-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule, 
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule
  ],
  templateUrl: './trips-dialog.component.html',
  styleUrls: ['./trips-dialog.component.css']
})
export class TripsDialogComponent implements OnInit {
  tripForm: FormGroup;
  isEditMode: boolean = false;
  drones: any[] = [];

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<TripsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.id; // More reliable check for edit mode
    this.tripForm = this.fb.group({
      name: ['', Validators.required],
      durationMinutes: [null, [Validators.required, Validators.min(1)]],
      droneId: ['', Validators.required],
      hadCrashes: [false],
      notes: ['']
    });

    if (this.isEditMode) {
      this.tripForm.patchValue({
        name: data.name,
        durationMinutes: data.durationMinutes,
        droneId: data.droneId,
        hadCrashes: data.hadCrashes || false,
        notes: data.notes || ''
      });
    }
  }

  async ngOnInit() {
    await this.loadDrones();
  }

  async loadDrones() {
    try {
      const dronesCollection = collection(this.firestore, 'drones');
      const querySnapshot = await getDocs(dronesCollection);
      this.drones = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isDeleted: data['isDeleted'] === true
          };
        })
        .filter(drone => !drone.isDeleted);
    } catch (error) {
      console.error('Error loading drones:', error);
    }
  }

  async saveTrip() {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const tripData = this.tripForm.value;

    try {
      if (this.isEditMode) {
        const tripDocRef = doc(this.firestore, 'trips', this.data.id);
        await updateDoc(tripDocRef, tripData);
      } else {
        await addDoc(collection(this.firestore, 'trips'), {
          ...tripData,
          createdAt: new Date()
        });
      }
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}