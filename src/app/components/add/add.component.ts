import { AfterContentInit, Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent implements OnInit, AfterContentInit {
  public value!: string;

  constructor(private cfg: DynamicDialogConfig, private ref: DynamicDialogRef) {}

  public ngOnInit(): void {
    const selected: TreeNode = this.cfg.data?.selected;
    this.value = selected ? selected.key + '.' : '';
  }

  public ngAfterContentInit(): void {
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
    if (!this.value) {
      return;
    }
    this.ref.close(this.value);
  }
}
