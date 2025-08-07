import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Firestore, collection, doc, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { UsersFormComponent } from './users-form/users-form.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatCardModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['email', 'role', 'fullName', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  isAdmin = false;
  currentUser: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private firestore: Firestore,
    private dialog: MatDialog,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
      user?.getIdTokenResult().then(token => {
        this.isAdmin = token.claims['admin'] === true;
      });
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadUsers() {
    const usersRef = collection(this.firestore, 'users');
    onSnapshot(usersRef, (snapshot) => {
      this.dataSource.data = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
    });
  }

  openUserDialog(user?: any) {
    this.dialog.open(UsersFormComponent, {
      width: '500px',
      data: user || null
    });
  }

  async deleteUser(userId: string) {
    if (confirm('Delete this user?')) {
      try {
        await updateDoc(doc(this.firestore, 'users', userId), {
          isActive: false
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  }
}