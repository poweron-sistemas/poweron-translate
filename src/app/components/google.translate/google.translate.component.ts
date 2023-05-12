import { AfterContentInit, Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { GoogleTranslateService } from 'src/app/core/services/google.translate.service';

@Component({
  selector: 'app-google.translate',
  templateUrl: './google.translate.component.html',
  styleUrls: ['./google.translate.component.css']
})
export class GoogleTranslateComponent implements OnInit, AfterContentInit {
  public key!: string;
  public testing!: boolean;

  constructor(
    private googleTranslateService: GoogleTranslateService,
    private ref: DynamicDialogRef,
    private messageService: MessageService
  ) {}

    public ngOnInit(): void {
      this.key = this.googleTranslateService.getKey();
    }

    public ngAfterContentInit(): void {
      setTimeout(() => {
        document.getElementById('key')?.focus();
      }, 100);
    }

    public handleKey(event: any): void {
      if (event.key === 'Enter') {
        this.process();
      }
    }

    public close(): void {
      this.ref.close(false);
    }

    public process(): void {
      if (!this.key) {
        return;
      }
      this.googleTranslateService.setKey(this.key);
      this.testing = true;
      this.googleTranslateService.translate({ q: 'test', format: 'text', target: 'en', source: 'es'}).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success', detail: 'Google Translate se configuró correctamente', summary: 'Configuración exitosa'
          });
          this.ref.close();
        },
        error: (response) => {
          this.testing = false;
          this.googleTranslateService.setKey('');
          this.messageService.add({
            severity: 'error',
            detail: '[' + (response.error?.error?.code || '') + '] ' +
              (response.error?.error?.message || '') +
              ' (' + (response.error?.error?.status || '') + ')'
            ,
            summary: 'Error en la configuración'
          });
        }
      });

    }
}
