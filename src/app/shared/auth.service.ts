import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn: boolean = false;

  constructor(private fireauth: AngularFireAuth, private router: Router) {
    this.fireauth.authState.subscribe(user => {
      this.isLoggedIn = !!user;
    })
  }

  login(email: string, password: string) {
    this.fireauth.signInWithEmailAndPassword(email, password).then(res => {
      localStorage.setItem('token', 'true');

      if (res.user?.emailVerified) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/verify-email']);
      }
    }, err => {
      alert(err.message);
      this.router.navigate(['/login']);
    })
  }

  register(email: string, password: string) {
    this.fireauth.createUserWithEmailAndPassword(email, password).then(res => {
      alert('Registration Succesful');
      this.router.navigate(['/login']);
      this.sendEmailForVerification(res.user);
    }, err => {
      alert(err.message);
      this.router.navigate(['/register']);
    })
  }

  logout() {
    this.fireauth.signOut().then(() => {
      localStorage.removeItem('token');
      this.router.navigate(['/']);
    }, err => {
      alert(err.message);
    })
  }

  loadMap() {
    this.router.navigate(['/map']);
  }

  forgotPassword(email: string) {
    this.fireauth.sendPasswordResetEmail(email).then(() => {
      this.router.navigate(['/verify-email']);
    }, err => {
      alert('Something went wrong');
    })
  }

  sendEmailForVerification(user: any) {
    user.sendEmailVerification().then(() => {
      this.router.navigate(['/verify-email']);
    }, () => {
      alert('Something went wrong. Not able to email you');
    });
  }
}
