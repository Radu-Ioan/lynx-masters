import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { EsriMapComponent } from "./pages/esri-map/esri-map.component";
import { AppRoutingModule } from "./app-routing.module";

import { environment } from '../environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';

import { FirebaseService } from './services/database/firebase';
import { FirebaseMockService } from './services/database/firebase-mock';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

import { FlexLayoutModule } from '@angular/flex-layout';
import { initializeApp,provideFirebaseApp } from '@angular/fire/app';
import { provideAuth,getAuth } from '@angular/fire/auth';
import { provideDatabase,getDatabase } from '@angular/fire/database';
import { provideFirestore,getFirestore } from '@angular/fire/firestore';
import { LoginComponent } from './component/login/login.component';
import { RegisterComponent } from './component/register/register.component';
import { HomeComponent } from './component/home/home.component';
import { FormsModule } from "@angular/forms";
import { VerifyEmailComponent } from './component/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './component/forgot-password/forgot-password.component';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { IndexComponent } from './component/index/index.component';


@NgModule({
  declarations: [AppComponent, EsriMapComponent, LoginComponent, RegisterComponent, HomeComponent, VerifyEmailComponent, ForgotPasswordComponent, IndexComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    FlexLayoutModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    AngularFireModule.initializeApp(environment.firebase, 'AngularDemoArcGIS'),
    AngularFireDatabaseModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  providers: [
    FirebaseService,
    FirebaseMockService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
