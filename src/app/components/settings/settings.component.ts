import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { POTProject } from 'src/app/core/models/project';
import { POTSettings } from 'src/app/core/models/settings';
import { POTTranslationProvider } from 'src/app/core/models/translation.provider';
import { ProjectService } from 'src/app/core/services/project.service';
import { SettingsService } from 'src/app/core/services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  public fg!: FormGroup;
  public project!: POTProject;
  public settings!: POTSettings;
  public themes = [
    { label: 'Claro', value: 'light', icon: 'fas fa-sun text-yellow-500' },
    { label: 'Oscuro', value: 'dark', icon: 'fas fa-moon' }
  ];
  public translationProvidersOptions = [
    { label: 'Google Translate', value: 'google' }
  ];
  constructor(
    private cfg: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    private projectService: ProjectService,
    private settingsService: SettingsService
  ) {}

  public ngOnInit(): void {
    this.project = this.cfg.data?.project;
    this.settings = this.settingsService.extractSettings();
    this.fg = new FormGroup({
      theme: new FormControl(this.settings.theme, [Validators.required]),
      webhook: new FormControl(this.settings.webhook),
      translationProviders: new FormArray(this.getTranslationProvidersFormGroup(this.settings.translationProviders || []))
    });
  }

  public get translationProviders(): FormArray {
    return this.fg.get('translationProviders') as FormArray;
  }

  public addTranslationProvider(translationProvider?: POTTranslationProvider): void {
    this.translationProviders.push(this.createTranslationProviderFormGroup(translationProvider));
  }

  public removeTranslationProvider(index: number): void {
    this.translationProviders.removeAt(index);
  }

  public createTranslationProviderFormGroup(translationProvider?: POTTranslationProvider): FormGroup {
    return new FormGroup({
      name: new FormControl(translationProvider ? translationProvider.name : '', [Validators.required]),
      apiKey: new FormControl(translationProvider ? translationProvider.apiKey : '', [Validators.required]),
      capitalize: new FormControl(translationProvider ? translationProvider.capitalize : false)
    });
  }

  public getTranslationProvidersFormGroup(translationProviders: POTTranslationProvider[]): FormGroup[] {
    const groups: FormGroup[] = [];
    for (const translationProvider of translationProviders) {
      groups.push(this.createTranslationProviderFormGroup(translationProvider));
    }
    return groups;
  }

  public handleTheme(): void {
    document.getElementById('themeApp')?.setAttribute('href', '/assets/themes/' + this.fg.get('theme')?.value + '/theme.css');
  }

  public close(): void {
    this.ref.close(false);
  }

  public process(): void {
    this.fg.markAllAsTouched();
    if (this.fg.invalid) {
      return;
    }
    const updatedSettings: POTSettings = this.fg.value;
    this.settings.theme = updatedSettings.theme;
    this.settings.webhook = updatedSettings.webhook;
    this.settings.translationProviders = updatedSettings.translationProviders;
    this.settingsService.setSettings(this.settings);
    this.projectService.updateProjectSettings(this.settings);
    this.ref.close();
  }
}
