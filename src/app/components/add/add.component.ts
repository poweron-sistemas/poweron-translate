import { AfterViewInit, Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent implements OnInit, AfterViewInit {
  public address!: string;

  constructor(private cfg: DynamicDialogConfig, private ref: DynamicDialogRef) {}

  public ngOnInit(): void {
    this.address = this.cfg.data?.address ? (this.cfg.data?.address + '.') : '';
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      document.getElementById('translationId')?.focus();
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
    if (!this.address) {
      return;
    }

    this.ref.close(this.address.split('.').filter(a => a));
  }
}
