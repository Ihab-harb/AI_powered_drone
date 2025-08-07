import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TripsDialogComponent } from './trips-dialog/trips-dialog.component';
import { Firestore, collection, getDocs, doc, deleteDoc } from '@angular/fire/firestore';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatTableModule, 
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatCardModule,
  ],
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class TripsComponent implements OnInit {
  trips: any[] = [];
  drones: any[] = [];
  displayedColumns: string[] = ['name', 'durationMinutes', 'drone', 'hadCrashes', 'actions'];

  constructor(
    private dialog: MatDialog,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    await this.loadDrones();
    await this.loadTrips();
  }

  async loadDrones() {
    const dronesCollection = collection(this.firestore, 'drones');
    const querySnapshot = await getDocs(dronesCollection);
    this.drones = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async loadTrips() {
    const tripsCollection = collection(this.firestore, 'trips');
    const querySnapshot = await getDocs(tripsCollection);
    this.trips = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  getDroneName(droneId: string): string {
    const drone = this.drones.find(d => d.id === droneId);
    return drone ? drone.name : 'Unknown Drone';
  }

  async deleteTrip(tripId: string) {
    if (confirm('Are you sure you want to delete this trip?')) {
      try {
        await deleteDoc(doc(this.firestore, 'trips', tripId));
        this.trips = this.trips.filter(trip => trip.id !== tripId);
      } catch (error) {
        console.error('Error deleting trip:', error);
      }
    }
  }

  openAddTripDialog(): void {
    const dialogRef = this.dialog.open(TripsDialogComponent, {
      width: '600px',
      data: { drones: this.drones }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTrips();
      }
    });
  }

  editTrip(trip: any): void {
    const dialogRef = this.dialog.open(TripsDialogComponent, {
      width: '600px',
      data: { ...trip, drones: this.drones }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTrips();
      }
    });
  }
}