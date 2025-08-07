import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
export const appConfig: ApplicationConfig = {
    providers: [provideRouter(routes, withComponentInputBinding()), provideFirebaseApp(() => initializeApp({ projectId: "novadrone-390d0", appId: "1:918917214128:web:74aebf6e016789b9917075", storageBucket: "novadrone-390d0.firebasestorage.app", apiKey: "AIzaSyAWkqhZbEibCk9Knzo7O2SgynUZEBB2m0Q", authDomain: "novadrone-390d0.firebaseapp.com", messagingSenderId: "918917214128", measurementId: "G-PGZJX8KWQ7" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]

};
