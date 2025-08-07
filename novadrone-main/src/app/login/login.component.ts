import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class LoginComponent {
    email: string = '';
    password: string = '';
    message: string = '';
    isLoading: boolean = false;
    
    private router = inject(Router);
    private auth = inject(Auth);
    private firestore = inject(Firestore);

    async onLogin() {
        this.isLoading = true;
        this.message = '';
        
        try {
            // 1. Authenticate user
            const userCredential = await signInWithEmailAndPassword(
                this.auth,
                this.email,
                this.password
            );

            // 2. Check if user exists in Firestore
            const userDocRef = doc(this.firestore, 'users', userCredential.user.uid);
            const userDoc = await getDoc(userDocRef);

            // 3. Redirect logic
            if (userDoc.exists() && userDoc.data()['role'] === 'pilot') {
                // Pilot user - go to drones page
                await this.router.navigate(['/drones']);
            } else {
                // Regular user (not in Firestore or without role) - go to dashboard
                await this.router.navigate(['/dashboard']);
            }
            
        } catch (error: any) {
            console.error('Login error:', error);
            this.message = this.getFriendlyError(error.code);
        } finally {
            this.isLoading = false;
        }
    }

    private getFriendlyError(code: string): string {
        const errors: Record<string, string> = {
            'auth/invalid-email': 'Invalid email format',
            'auth/user-disabled': 'Account disabled',
            'auth/user-not-found': 'Account not found',
            'auth/wrong-password': 'Incorrect password',
        };
        return errors[code] || 'Login failed. Please try again.';
    }
}