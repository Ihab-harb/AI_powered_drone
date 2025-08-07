import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { collection, addDoc, updateDoc, doc, getDocs, query } from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';

interface StatusOption {
  value: string;
  viewValue: string;
}

interface User {
  uid: string;
  email: string;
  fullName?: string;
}

@Component({
  selector: 'app-drone-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ReactiveFormsModule,
  ],
  templateUrl: './drone-form.component.html',
  styleUrls: ['./drone-form.component.css']
})
export class DroneFormComponent implements OnInit {
  droneCategories = [
    'Race drone',
    'People detection drone',
    'Flower detection drone',
    'Fun drone',
    'Others'
  ];

  statusOptions: StatusOption[] = [
    { value: 'active', viewValue: 'Active' },
    { value: 'maintenance', viewValue: 'In Maintenance' },
    { value: 'retired', viewValue: 'Retired' },
    { value: 'lost', viewValue: 'Lost' },
    { value: 'damaged', viewValue: 'Damaged' }
  ];

  users: User[] = [];
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  droneForm: FormGroup;
  isEditMode: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DroneFormComponent>,
    private firestore: Firestore,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.isEditMode = !!data;
    this.droneForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      batteryCapacity: [null, [Validators.required, Validators.min(0)]],
      batteryVoltage: [null, [Validators.required, Validators.min(3.0), Validators.max(25)]],
      weight: [null, [Validators.required, Validators.min(0)]],
      color: [''],
      status: ['active', Validators.required],
      assignedUserId: [''],
      imageName: [null],
      imageBase64: [null],
      isDeleted: [false]
    });

    if (this.isEditMode) {
      this.droneForm.patchValue(data);
      if (data.imageBase64) {
        this.previewUrl = data.imageBase64;
      }
    }
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection);
    const querySnapshot = await getDocs(q);
    
    this.users = querySnapshot.docs.map(doc => {
      const data = doc.data() as User;
      return {
        uid: doc.id,
        email: data.email,
        fullName: data.fullName
      };
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      if (file.size > 500000) {
        alert('Image is too large. Please select an image smaller than 500KB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
        this.droneForm.patchValue({
          imageName: file.name,
          imageBase64: reader.result?.toString()
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.previewUrl = null;
    this.selectedFile = null;
    this.droneForm.patchValue({
      imageName: null,
      imageBase64: null
    });
  }

  async save(): Promise<void> {
    if (this.droneForm.invalid) {
      this.droneForm.markAllAsTouched();
      return;
    }

    const droneData = {
      ...this.droneForm.value,
      isDeleted: false
    };

    try {
      if (this.isEditMode) {
        const droneDocRef = doc(this.firestore, 'drones', this.data.id);
        await updateDoc(droneDocRef, droneData);
      } else {
        await addDoc(collection(this.firestore, 'drones'), droneData);
      }
      this.dialogRef.close(droneData);
    } catch (error) {
      console.error('Error saving drone data:', error);
      alert('Error saving drone. Please try again.');
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}