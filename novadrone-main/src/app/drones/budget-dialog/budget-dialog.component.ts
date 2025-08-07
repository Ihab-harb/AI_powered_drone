import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Firestore, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-budget-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule
  ],
  templateUrl: './budget-dialog.component.html',
  styleUrls: ['./budget-dialog.component.css']
})
export class BudgetDialogComponent implements OnInit {
  budgetForm: FormGroup;
  isNewBudget = true;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    public dialogRef: MatDialogRef<BudgetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { droneId: string }
  ) {
    this.budgetForm = this.fb.group({
      budget: this.fb.group({
        expectedCost: [null, [Validators.min(0)]],
        actualCost: [null, [Validators.min(0)]],
        maintenanceBudget: [null, [Validators.min(0)]],
        modificationBudget: [null, [Validators.min(0)]],
        estimatedHours: [null, [Validators.min(0)]],
        actualHours: [null, [Validators.min(0)]],
        notes: [null]
      })
    });
  }

  async ngOnInit() {
    await this.loadExistingBudget();
  }

  async loadExistingBudget() {
    const droneDocRef = doc(this.firestore, `drones/${this.data.droneId}`);
    const droneDoc = await getDoc(droneDocRef);
    
    if (droneDoc.exists() && droneDoc.data()['budget']) {
      this.isNewBudget = false;
      this.budgetForm.patchValue({
        budget: droneDoc.data()['budget']
      });
    }
  }

  async saveBudget() {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    try {
      const droneDocRef = doc(this.firestore, `drones/${this.data.droneId}`);
      
      // Prepare update data
      const updateData = {
        budget: {
          ...this.budgetForm.value.budget,
          updatedAt: new Date().toISOString()
        }
      };

      // If new budget, add createdAt timestamp
      if (this.isNewBudget) {
        updateData.budget['createdAt'] = new Date().toISOString();
      }

      await updateDoc(droneDocRef, updateData);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}