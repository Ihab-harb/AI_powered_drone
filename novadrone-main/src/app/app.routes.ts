import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DronesComponent } from './drones/drones.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TripsComponent } from './trips/trips.component';
import { UsersComponent } from './users/users.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'drones', component: DronesComponent },
            { path: 'users', component: UsersComponent },
            { path: 'trips', component: TripsComponent }
        ]
    },
];
