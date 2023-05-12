import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileUpload } from 'primeng/fileupload';
import { POTLanguages } from 'src/app/core/lib/languages';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.css']
})
export class ImportComponent implements OnInit {
  public files!: any[];
  public principal!: any[];
  public translations: {[key: string]: any } = {};
  public languages = POTLanguages;
  public importing!: boolean;

  constructor(private cfg: DynamicDialogConfig, private ref: DynamicDialogRef, private messageService: MessageService) {}

  public ngOnInit(): void {
    this.files = this.cfg.data?.files;
  }

  public process(): void {
    if (this.importing || !this.files || this.files.length == 0) {
      return;
    }
    this.importing = true;
    this.handleTranslations()
      .then(translations => {
        const result = {
          principal: this.principal || this.files[0].code,
          translations
        };

        try {
          localStorage.setItem('POTTranslations', JSON.stringify(result));
          this.ref.close(result);
        } catch (e) {
          this.messageService.add({ severity: 'error', detail: 'No se pudieron almacenar las traduciones localmente', summary: 'Error de almacenamiento' })
        }
      })
      .catch(() => {
        this.importing = false;
      })
    ;
  }

  public  handleTranslations(): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      const translations: { [key: string]: any } = {};
      let index = 0;
      for (const file of this.files) {
        const reader = new FileReader();
        reader.onload = content => {
          index ++;
          try {
            const parsed = JSON.parse(content.target?.result as string);
            translations[file.language] = parsed;
            if (index === this.files.length) {
              resolve(translations);
            }
          } catch (e) {
            this.messageService.add({
              severity: 'error',
              detail: 'No se pudo importar el archivo (' + file.name + ')',
              summary: 'Archivo inválido'
            });
            reject();
          }
        }
        reader.readAsText(file.data);
      }
    });
  }

  public close(): void {
    this.ref.close(false);
  }

  public handleSelectFile(files: File[]): void {
    this.files = [];
    for (const file of files) {
      const sp = file.name.split('.');
      const sp2 = sp[0].split('-');
      this.files.push({
        name: file.name,
        data: file,
        language: this.languages.find(l => l.code == sp2[0])?.code,
        languageName: this.languages.find(l => l.code == sp2[0])?.name
      })
    }
  }
}
