import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  isSidebarOpen = true;
  currentUser: any;
  userRole: string | null = null;

  constructor(
    private router: Router, 
    private auth: Auth,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    this.auth.onAuthStateChanged(async user => {
      this.currentUser = user;
      if (user) {
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        this.userRole = userDoc.exists() ? userDoc.data()['role'] : null;
      } else {
        this.userRole = null;
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }
}