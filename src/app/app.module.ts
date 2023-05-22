import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SplitterModule } from 'primeng/splitter';
import { AppComponent } from './app.component';
import { MenubarModule } from 'primeng/menubar';
import { TreeModule } from 'primeng/tree';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { ContextMenuModule } from 'primeng/contextmenu';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AddComponent } from './components/add/add.component';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SkeletonModule } from 'primeng/skeleton';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { MenuComponent } from './components/menu/menu.component';
import { NodesComponent } from './components/nodes/nodes.component';
import { ProjectComponent } from './components/project/project.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { SettingsComponent } from './components/settings/settings.component';

@NgModule({
  declarations: [
    AppComponent,
    AddComponent,
    MenuComponent,
    NodesComponent,
    ProjectComponent,
    SettingsComponent
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
    RadioButtonModule,
    TooltipModule,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    TableModule,
    TabViewModule
  ],
  providers: [MessageService, DialogService, ConfirmationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
