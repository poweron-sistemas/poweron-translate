import { Component, OnDestroy, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { POTLanguages } from 'src/app/core/lib/languages';

@Component({
  selector: 'app-languages',
  templateUrl: './languages.component.html',
  styleUrls: ['./languages.component.css']
})
export class LanguagesComponent implements OnInit {
  public languages = POTLanguages;
  public principal!: string;
  public principalIndex!: number;
  public files!: {[key: string]: any};
  public iterator: any[] = [];
  constructor(private cfg: DynamicDialogConfig, private ref: DynamicDialogRef) {}

  public ngOnInit(): void {
    this.files = this.cfg.data?.files;
    this.principal = this.cfg.data?.principal;

    for (const lng in this.files) {
      this.iterator.push({
        lng,
        data: this.files[lng]
      });
    }

    this.principalIndex = this.iterator.findIndex(i => i.lng === this.principal);
    if (this.principalIndex == -1) {
      this.principalIndex = 0;
    }

  }

  public addLanguage(): void {
    this.iterator.push({
      lng: '',
      data: {}
    });
  }

  public removeLanguage(index: number): void {
    this.iterator.splice(index, 1);
  }

  public close(): void {
    this.ref.close(false);
  }

  public process(): void {
    this.principal = this.iterator[this.principalIndex]?.lng;
    if (!this.principal) {
      return;
    }

    this.files = {};
    for (const i of this.iterator) {
      this.files[i.lng] = i.data;
    }
    this.ref.close({
      files: this.files,
      principal: this.principal
    });
  }
}
