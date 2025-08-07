import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DroneFormComponent } from './drone-form/drone-form.component';
import { BudgetDialogComponent } from './budget-dialog/budget-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Firestore, collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs } from '@angular/fire/firestore';import { MatSnackBar } from '@angular/material/snack-bar';
import { Auth } from '@angular/fire/auth';
import { PdfService } from '../../shared/ pdf.service';

@Component({
  selector: 'app-drones',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule
  ],
  templateUrl: './drones.component.html',
  styleUrls: ['./drones.component.css']
})
export class DronesComponent implements OnInit {
  drones: any[] = [];
  currentUserId: string | null = null;
  isPilot: boolean = false;
  isLoading: boolean = true;

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private pdfService = inject(PdfService);

  async ngOnInit(): Promise<void> {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.currentUserId = user.uid;
        await this.checkUserRole();
        this.loadDrones();
      }
    });
  }

  private async checkUserRole(): Promise<void> {
    if (!this.currentUserId) return;
    
    const userDoc = await getDoc(doc(this.firestore, 'users', this.currentUserId));
    this.isPilot = userDoc.exists() && userDoc.data()?.['role'] === 'pilot';
  }

  private loadDrones(): void {
    if (!this.currentUserId) return;

    const dronesCollection = collection(this.firestore, 'drones');
    const conditions = [
      where('isDeleted', '==', false)
    ];

    if (this.isPilot) {
      conditions.push(where('assignedUserId', '==', this.currentUserId));
    }

    const q = query(dronesCollection, ...conditions);

    onSnapshot(q, (snapshot) => {
      this.drones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      this.isLoading = false;
    });
  }

  openDroneDialog(drone?: any): void {
    if (this.isPilot) {
      this.showErrorMessage('Pilots cannot modify drones');
      return;
    }

    const dialogRef = this.dialog.open(DroneFormComponent, {
      width: '500px',
      data: drone ? { ...drone } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccessMessage(`Drone ${drone ? 'updated' : 'added'} successfully`);
      }
    });
  }

  async deleteDrone(droneId: string): Promise<void> {
    if (this.isPilot) {
      this.showErrorMessage('Pilots cannot delete drones');
      return;
    }

    try {
      await updateDoc(doc(this.firestore, 'drones', droneId), {
        isDeleted: true
      });
      this.showSuccessMessage('Drone deleted successfully');
    } catch (error) {
      this.showErrorMessage('Error deleting drone');
      console.error('Delete error:', error);
    }
  }

  async openBudgetDialog(drone: any): Promise<void> {
    const dialogRef = this.dialog.open(BudgetDialogComponent, {
      width: '500px',
      data: { droneId: drone.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccessMessage('Budget details saved successfully');
      }
    });
  }

  async generatePdfReport(drone: any): Promise<void> {
    this.isLoading = true;
    try {
      // First get the latest budget data from subcollection
      const budgetsRef = collection(this.firestore, `drones/${drone.id}/budgets`);
      const querySnapshot = await getDocs(budgetsRef);
      
      // Merge budget data with drone data
      const budgetData = querySnapshot.empty ? {} : querySnapshot.docs[0].data();
      const droneWithBudget = { ...drone, ...budgetData };
  
      await this.pdfService.generateDroneReport(droneWithBudget);
      this.showSuccessMessage('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      this.showErrorMessage(
        error instanceof Error ? error.message : 'Failed to generate PDF report'
      );
    } finally {
      this.isLoading = false;
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    img.parentElement?.classList.add('no-image');
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}