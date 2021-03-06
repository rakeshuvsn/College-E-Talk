import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { WebstorageService } from './webstorage.service';
import {Observable} from 'rxjs';
import { AngularFireStorage  } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  studentCollection: Observable<any>;
  facultyCollection: AngularFirestoreCollection<any>;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private webStorage: WebstorageService,
    private storage: AngularFireStorage
  ) {
    this.facultyCollection = this.db.collection('faculty');
  }

  fetchStudents(userId): Observable<any> {
    return this.db.collection('students', ref => ref.where('id', '==', userId)).valueChanges();
  }

  fetchFaculty(userId): Observable<any>  {
    return this.db.collection('faculty', ref => ref.where('id', '==', userId)).valueChanges();
  }

  fetchUsersByRoleId(userId): Observable<any> {
    return this.db.collection('users', ref => ref.where('user.id', '==', userId)).valueChanges();
  }

  fetchUserById(userId): Observable<any> {
    return this.db.doc(`users/${userId}`).valueChanges();
  }

  fetchUsersByEmail(email): Observable<any> {
    return this.db.collection('users', ref => ref.where('email', '==', email)).valueChanges();
  }

  saveProfilePicture(file, user) {
    return this.storage.upload(`users/${file.name}`, file).then(data => {
      return data.ref.getDownloadURL().then(urlData => {
        user.user.photoUrl = urlData;
        return this.db.doc(`users/${user.id}`).set(user).then(metaData => {
          return metaData;
        }).catch(error => {
          console.log(error);
        });
      });
    });
  }

  saveBio(bioText, user) {
    user.bio = bioText;
    user.user.bio = bioText;
    return this.db.doc(`users/${user.id}`).set(user).then(metaData => {
      return metaData;
    }).catch(error => {
      console.log(error);
    });
  }
}
