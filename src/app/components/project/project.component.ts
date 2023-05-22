import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MessageService, TreeNode } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { POTLanguages } from 'src/app/core/lib/languages';
import { POTLanguage } from 'src/app/core/models/language';
import { POTProject } from 'src/app/core/models/project';
import { POTTranslation } from 'src/app/core/models/translation';
import { ProjectService } from 'src/app/core/services/project.service';
import { SettingsService } from 'src/app/core/services/settings.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit, AfterViewInit {
  public project!: POTProject | undefined;
  public fg!: FormGroup;
  public languagesOptions = POTLanguages;

  constructor(
    private projectService: ProjectService,
    private settingsService: SettingsService,
    private ref: DynamicDialogRef,
    private cfg: DynamicDialogConfig,
    private messageService: MessageService
  ) {}

  public ngOnInit(): void {
    this.project = this.cfg.data?.project;
    this.fg = new FormGroup({
      name: new FormControl(this.project ? this.project.name : '', [Validators.required, Validators.minLength(3), Validators.maxLength(12)]),
      primary: new FormControl(this.project ? this.project.primary : '', [Validators.required]),
      languages: new FormArray(this.createLanguagesFormArray(this.project ? this.project.languages : []), [Validators.required])
    });
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      document.getElementById('name')?.focus();
    }, 100);
  }

  public createLanguagesFormArray(languages: POTLanguage[]): FormGroup[] {
    const groups: FormGroup[] = [];
    for (const language of languages) {
      groups.push(this.getLanguageFormGroup(language));
    }
    return groups;
  }

  public get languages(): FormArray {
    return this.fg.get('languages') as FormArray;
  }

  public addLanguage(language?: POTLanguage): void {
    this.languages.push(this.getLanguageFormGroup(language));
  }

  public getLanguageFormGroup(language?: POTLanguage): FormGroup {
    return new FormGroup({
      code: new FormControl(language ? language.code : '', [Validators.required]),
      file: new FormControl(language ? language.file : '', [Validators.required]),
      data: new FormControl(language ? language.data : '')
    });
  }

  public importLanguage(): void {
    document.getElementById('inputFile')?.click();
  }

  public handleImportedFile(event: any): void {
    const files: File[] = event.target.files;
    if (!files.length) {
      return;
    }
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = content => {
        try {
          const parsed = JSON.parse(content.target?.result as string);
          const sp = file.name.split('.');
          const sp2 = sp[0].split('-');
          this.addLanguage({
            code: sp2[0],
            file: file.name,
            data: parsed
          });
        } catch (e) {
          console.error(e);
          this.messageService.add({
            severity: 'error',
            detail: 'No se pudo importar el archivo (' + file.name + ')',
            summary: 'Archivo inválido'
          });
        }
      }
      reader.readAsText(file);
    }
  }

  public removeLanguage(index: number): void {
    this.languages.removeAt(index);
  }

  public close(): void {
    this.ref.close();
  }

  public handleLanguage(index: number): void {
    const control = this.languages.controls[index];
    const file = control.get('code')?.value + '.json';
    control.get('file')?.setValue(file);
  }

  public process(): void {
    this.fg.markAllAsTouched();
    if (this.fg.invalid) {
      return;
    }
    const languages: any[] = this.fg.get('languages')?.value;
    const index = languages.findIndex((language: POTLanguage) => language.code === this.fg.get('primary')?.value);
    const primary = { ...languages[index] };
    languages.splice(index, 1);
    languages.unshift(primary);
    if (this.project?.nodes.length) {
      languages.map(language => {
        language.data = this.projectService.parseLanguage(this.project?.nodes as TreeNode[], language.code);
      });
    }
    let nodes: TreeNode[] = [];
    for (const language of languages) {
      nodes = this.generateNodes(language.data, language.code, nodes);
    }

    const project: POTProject = {
      name: this.fg.get('name')?.value.toLocaleUpperCase(),
      version: this.projectService.getVersion(),
      primary: this.fg.get('primary')?.value,
      nodes,
      selection: [],
      settings: this.settingsService.extractSettings(),
      languages: languages.map((language: POTLanguage) => {
        return {
          code: language.code,
          file: language.file
        }
      })
    };
    this.projectService.setSelection([]);
    if (this.projectService.setProject(project)) {
      this.ref.close(false);
    } else {
      this.messageService.add({
        severity: 'error',
        detail: 'Ocurrió un problema al guardar el proyecto',
        summary: 'No se pudo guardar el proyecto'
      });
    }
  }

  private generateNodes(data: { [key: string]: any } | undefined, code: string, nodes?: TreeNode[], parent?: TreeNode): TreeNode[] {
    const result: TreeNode[] = nodes || [];
    for (const label in data) {
      const node = nodes?.find(node => node.label === label);
      if (node) {
        if (typeof data[label] == 'string') {
          node.data.translations.push({ code, value: data[label] });
        } else {
          node.children = this.generateNodes(data[label], code, node.children, node);
        }
      } else {
        const node: TreeNode = {
          label,
          icon: typeof data[label] == 'string' ? 'far fa-rectangle-list' : 'far fa-folder-open text-yellow-500',
          key: (parent ? parent.key + '.' : '') + label,
          data: {
            translations: typeof data[label] == 'string' ? [{ code, value: data[label] }] : undefined
          }
        };
        node.children = typeof data[label] == 'string' ? [] : this.generateNodes(data[label], code, [], node);
        result.push(node);
      }
    }
    return result;
  }
}
