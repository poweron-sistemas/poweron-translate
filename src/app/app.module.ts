import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SplitterModule } from 'primeng/splitter';
import { AppComponent } from './app.component';
import { MenubarModule } from 'primeng/menubar';
import { TreeModule } from 'primeng/tree';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LanguagesComponent } from './components/languages/languages.component';
import { ImportComponent } from './components/import/import.component';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { ContextMenuModule } from 'primeng/contextmenu';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AddComponent } from './components/add/add.component';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { GoogleTranslateComponent } from './components/google.translate/google.translate.component';
import { SkeletonModule } from 'primeng/skeleton';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';

@NgModule({
  declarations: [
    AppComponent,
    LanguagesComponent,
    ImportComponent,
    AddComponent,
    GoogleTranslateComponent
  ],
  imports: [
    BrowserModule,
    SplitterModule,
    MenubarModule,
    TreeModule,
    ToastModule,
    BrowserAnimationsModule,
    DynamicDialogModule,
    FileUploadModule,
    FormsModule,
    DropdownModule,
    DividerModule,
    InputTextModule,
    ContextMenuModule,
    InputTextareaModule,
    ConfirmPopupModule,
    ConfirmDialogModule,
    BreadcrumbModule,
    SkeletonModule,
    CheckboxModule,
    RadioButtonModule
  ],
  providers: [MessageService, DialogService, ConfirmationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
