import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AlertType } from './../enums/alert-type.enum';
import { Router } from '@angular/router';
import { User } from '../classes/user';
import { AlertService } from './alert.service';
import { Alert } from './../classes/alert';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import {WebstorageService} from './webstorage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public currentUser: Observable<User | null>;
  public currentUserSnapShot: User | null;
  public authState: any | null;
  public isLoggedIn: EventEmitter<boolean>  = new EventEmitter();

  constructor(
    private router: Router,
    private alertService: AlertService,
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private webStorage: WebstorageService
  ) {

    this.currentUser = this.afAuth.authState.pipe(switchMap((user) => {
        if (user) {
          this.authState = user;
          return this.db.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );

    this.setCurrentUserSnapShot();
  }

  get authenticated(): boolean {
    return this.authState !== null;
  }

  public signup(userObject: any, email: string, password: string): Observable<boolean> {

    return from(
      this.afAuth.auth.createUserWithEmailAndPassword(email, password).then((user: any) => {
        const userRef: AngularFirestoreDocument<User> = this.db.doc(`users/${user.user.uid}`);

        const updateUser = {
          id: user.user.uid,
          email: user.user.email,
          roleId: userObject.id,
          user: userObject
        };

        userRef.set(updateUser);
        return true;
      }).catch((error) => {
        console.log(error);
        return false;
      })
    );
  }

  public login(email: string, password: string): Observable<boolean> {
    return from(
      this.afAuth.auth.signInWithEmailAndPassword(email, password).then((user) => {
        this.isLoggedIn.emit(true);
        this.webStorage.setLoginStatus(true, 'user');
        this.db.doc(`users/${user.user.uid}`).valueChanges().subscribe(data => {
          this.webStorage.setUserObject(data);
        });
        return true;
      }).catch((error) => {
        console.log(error);
        return false;
      })
    );
  }

  public adminLogin(): Observable<any> {
    return this.db.collection('admin').doc('NIYfRjxKAfWFGbvCvex3').get();
  }

  public logout(): void {
    this.afAuth.auth.signOut().then((success) => {
      this.authState = null;
      this.currentUser = of(null);
      this.isLoggedIn.emit(false);
      this.webStorage.setLoginStatus(false, '');
      this.webStorage.setUserObject(null);
      this.router.navigate(['/login']);
      this.alertService.alerts.next(new Alert('You have been signed out.', AlertType.Success));
    }).catch(error => {
      this.alertService.alerts.next(new Alert('You have been signed out.', AlertType.Danger));
    });

  }

  public getUsers(): Observable<any> {
    return this.db.collection('students').valueChanges();
  }

  private setCurrentUserSnapShot(): void {
    this.currentUser.subscribe(user => {
      this.currentUserSnapShot = user;
    });
  }
}
