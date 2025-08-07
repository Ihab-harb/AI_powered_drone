import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './users-form.component.html',
  styleUrls: ['./users-form.component.css']
})
export class UsersFormComponent {
  userForm: FormGroup;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<UsersFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data;
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      role: ['pilot', Validators.required],
      fullName: ['']
    });

    if (this.isEditMode) {
      this.userForm.patchValue(data);
      this.userForm.get('password')?.clearValidators();
    }
  }

  async save() {
    if (this.userForm.invalid) return;
  
    const userData = this.userForm.value;
  
    try {
      if (this.isEditMode) {
        await updateDoc(
          doc(this.firestore, 'users', this.data.uid), 
          {
            email: userData.email,
            role: userData.role,
            fullName: userData.fullName
          }
        );
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          this.auth,
          userData.email,
          userData.password
        );
  
        await setDoc(
          doc(this.firestore, 'users', userCredential.user.uid), 
          {
            email: userData.email,
            role: userData.role,
            fullName: userData.fullName,
            createdAt: new Date()
          }
        );
      }
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        alert('This email is already registered. Please use a different email.');
      } else if (error.code === 'auth/weak-password') {
        alert('Password should be at least 6 characters');
      } else {
        alert('Error: ' + error.message);
      }
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}