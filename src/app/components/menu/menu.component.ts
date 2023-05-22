import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService, TreeNode } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { POTMainMenu } from 'src/app/core/lib/main.menu';
import { POTProject } from 'src/app/core/models/project';
import { MenuService } from 'src/app/core/services/menu.service';
import { ProjectService } from 'src/app/core/services/project.service';
import { ProjectComponent } from '../project/project.component';
import { SettingsComponent } from '../settings/settings.component';
import { WebhookService } from 'src/app/core/services/webhook.service';
import { POTLanguage } from 'src/app/core/models/language';
import { HttpErrorResponse } from '@angular/common/http';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver-es';
import { ActionsService } from 'src/app/core/services/actions.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  public menu = POTMainMenu;
  public update!: boolean;
  private project!: POTProject | undefined;
  constructor(
    private menuService: MenuService,
    private projectService: ProjectService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private webhookService: WebhookService,
    private actionsService: ActionsService
  ) {}

  public ngOnInit(): void {
    this.projectService.observeProject().subscribe({
      next: project => {
        this.project = project;
        this.menuService.handle('disabled', ['download', 'languages'], project ? false : true);
      }
    });

    (this.menu.find(i => i.id == 'clear') as MenuItem).command = this.menuItemClear.bind(this);
    (this.menu.find(i => i.id == 'new') as MenuItem).command = this.menuItemNew.bind(this);
    (this.menu.find(i => i.id == 'open') as MenuItem).command = this.menuItemOpen.bind(this);
    (this.menu.find(i => i.id == 'upload') as MenuItem).command = this.menuItemUpload.bind(this);
    (this.menu.find(i => i.id == 'download') as MenuItem).command = this.menuItemDownload.bind(this);
    (this.menu.find(i => i.id == 'project') as MenuItem).command = this.menuItemProject.bind(this);
    (this.menu.find(i => i.id == 'settings') as MenuItem).command = this.menuItemSettings.bind(this);
    (this.menu.find(i => i.id == 'export') as MenuItem).command = this.menuItemExport.bind(this);

    this.menuService.observeBehavior().subscribe({
      next: behavior => {
        const ids: string[] = Array.isArray(behavior.id) ? behavior.id : [behavior.id];
        const items: MenuItem[] = this.menu.filter(item => ids.indexOf(item.id as string) > -1);
        switch (behavior.type) {
          case 'disabled': items.map(item => item.disabled = behavior.value); break;
          case 'loading': {
            items.map(item => {
              if (behavior.value) {
                item.badgeStyleClass = item.icon,
                item.icon = 'fas fa-circle-notch fa-spin'
              } else {
                item.icon = item.badgeStyleClass;
                item.badgeStyleClass = undefined;
              }
            });
          }
          break;
          case 'command': items.map(item => item.command = behavior.value); break;
          case 'trigger': items.map(item => item.command ? item.command(behavior.value) : ''); break;
        }
        setTimeout(() => {
          this.update = true;
          setTimeout(() => {
            this.update = false;
          });
        });
      }
    });
  }

  public menuItemClear() {
    if (!this.project) {
      return;
    }
    this.confirmationService.confirm({
      message: '¿Está seguro de cerrar el proyecto actual?, esto eliminará el proyecto en curso "' + this.project.name + '"',
      header: 'Cerrar proyecto',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Aceptar',
      acceptIcon: 'pi pi-exclamation-triangle mr-2',
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.projectService.setSelection([]);
        this.projectService.setProject(undefined);
      }
    });
  }

  public menuItemNew() {
    if (this.project) {
      this.confirmationService.confirm({
        message: '¿Está seguro de crear un nuevo proyecto?, esto eliminará el proyecto en curso "' + this.project.name + '"',
        header: 'Comenzar un nuevo proyecto',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Aceptar',
        acceptIcon: 'pi pi-exclamation-triangle mr-2',
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: 'Cancelar',
        accept: () => {
          this.dialogService.open(ProjectComponent, { header: 'Nuevo proyecto', width: '750px' });
        }
      });
    } else {
      this.dialogService.open(ProjectComponent, { header: 'Nuevo proyecto', width: '750px' });
    }
  }

  public menuItemOpen() {
    if (this.project) {
      this.confirmationService.confirm({
        message: '¿Está seguro de abrir un proyecto existente?, esto eliminará el proyecto en curso "' + this.project.name + '"',
        header: 'Abrir un proyecto existente',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Aceptar',
        acceptIcon: 'pi pi-exclamation-triangle mr-2',
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: 'Cancelar',
        accept: () => {
          document.getElementById('fileOpenInput')?.click();
        },
        reject: () => {
          return;
        }
      });
    } else {
      document.getElementById('fileOpenInput')?.click();
    }
  }

  public menuItemProject(): void {
    this.dialogService.open(ProjectComponent, {
      header: 'Modificar proyecto "' + this.project?.name + '"',
      width: '750px',
      data: {
        project: this.project
      }
    });
  }

  public menuItemDownload() {
    if (!this.project) {
      return;
    }
    try {
      const link = document.createElement('a');

      link.setAttribute('download', this.project.name + '.pot');
      link.setAttribute('target', '_blank');
      link.style.display = 'none';

      document.body.appendChild(link);
      const json = JSON.stringify(this.projectService.extractProject(), null, '\t');
      const uri = "data:text/json;charset=UTF-8," + encodeURIComponent(json);
      link.setAttribute('href', uri);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      this.messageService.add({ severity: 'error', detail: 'No se pudo guardar el proyecto', summary: 'Error al descargar' });
    }
  }

  public menuItemUpload() {
    if (!this.project || !this.project.languages.length) {
      return;
    }
    this.confirmationService.confirm({
      message: '¿Está seguro de enviar los archivos al webhook?',
      header: 'Subir archivos por POST',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Aceptar',
      acceptIcon: 'far fa-check-circle mr-2',
      acceptButtonStyleClass: 'p-button-success',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.menuService.handle('loading', 'upload', true);
        try {
          const files: File[] = [];
          for (const language of this.project?.languages as POTLanguage[]) {
            const f = this.projectService.parseLanguage(this.project!.nodes as TreeNode[], language.code);
            const str = JSON.stringify(f, null, '\t');
            const blob = new Blob([str], { type: 'application/json' });
            files.push(new File([blob], language.file));
          }
          this.webhookService.send(this.project?.settings.webhook as string, files).subscribe({
            next: () => {
              this.menuService.handle('loading', 'upload', false);
              this.messageService.add({ severity: 'success', detail: 'Los archivos fueron enviados correctamente', summary: 'Subida exitosa' });
            },
            error: (e: HttpErrorResponse) => {
              this.messageService.add({
                severity: 'error',
                detail: 'Error en Webhook [' + e.status + '] (' + e.message + ')',
                summary: 'Error al generar archivo'
              });
              this.menuService.handle('loading', 'upload', false);
            }
          });
        } catch (e: any) {
          this.messageService.add({
            severity: 'error',
            detail: 'No se pudo generar el archivo json (' + e.message + ')',
            summary: 'Error al generar archivo'
          });
          this.menuService.handle('loading', 'upload', false);
        }
      }
    });
  }

  public menuItemSettings() {
    this.dialogService.open(SettingsComponent, {
      width: '750px',
      header: 'Configuración',
      data: {
        project: this.project
      }
    })
  }

  public menuItemExport() {
    if (!this.project?.nodes?.length) {
      return;
    }
    try {
      this.menuService.handle('loading', 'export', true);
      const zip = new JSZip();
      for (const language of this.project.languages as POTLanguage[]) {
        const f = this.projectService.parseLanguage(this.project!.nodes as TreeNode[], language.code);
        zip.file(language.file, JSON.stringify(f, null, '\t'));
      }
      zip.generateAsync({ type: 'blob' })
        .then(content => {
          saveAs(content, "i18n.zip");
          this.menuService.handle('loading', 'export', false);
        })
        .catch(e => {
          console.error(e);
          this.menuService.handle('loading', 'export', false);
          this.messageService.add({ severity: 'error', detail: 'No se pudo generar el archivo ZIP', summary: 'Error al exportar' });
        })
      ;
    } catch (e) {
      console.error(e);
      this.menuService.handle('loading', 'export', false);
      this.messageService.add({ severity: 'error', detail: 'No se pudo descargar un archivo', summary: 'Error al exportar' });
    }
  }

  public handleOpen(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      try {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const project: POTProject = JSON.parse(fileReader.result as string);
          this.projectService.setProject(project);
        }
        fileReader.readAsText(file);
      } catch (e) {
        this.messageService.add({ severity: 'error', detail: 'No se pudo abrir el archivo de traducción', summary: 'Error al abrir archivo' });
      }
    }
  }
}
