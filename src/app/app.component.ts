import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { MenuItem, MessageService, TreeDragDropService, TreeNode } from 'primeng/api';
import { GoogleTranslationService } from './core/translation.providers/google.translation.service';
import { POTProject } from './core/models/project';
import { ProjectService } from './core/services/project.service';
import { Title } from '@angular/platform-browser';
import { MenuService } from './core/services/menu.service';
import { POTTranslation } from './core/models/translation';
import { SettingsService } from './core/services/settings.service';
import { POTSettings } from './core/models/settings';
import { POTTranslationProvider } from './core/models/translation.provider';
import { HttpErrorResponse } from '@angular/common/http';
import { ActionsService } from './core/services/actions.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [TreeDragDropService]
})
export class AppComponent implements OnInit, AfterViewInit {
  public project!: POTProject | undefined;
  public loading!: boolean;
  public selection: TreeNode[] = [];
  public translating!: boolean;
  public suggesting!: boolean;
  public errorSuggest!: boolean;
  public suggestions: string[] = [];
  public settings!: POTSettings | undefined;
  public translationProvider!: POTTranslationProvider | undefined;

  @HostListener('window:keydown.control.q', ['$event'])
  public focusPrincipalLanguage(e: any) {
    e.preventDefault();
    const el: any = document.querySelector('.principal-language');
    el?.focus();
  }

  @HostListener('window:keydown.control.b', ['$event'])
  public translateAll(e?: any) {
    e?.preventDefault();
    this.handleTranslationAll();
  }

  constructor(
    private googleTranslateService: GoogleTranslationService,
    private projectService: ProjectService,
    private menuService: MenuService,
    private title: Title,
    private settingsService: SettingsService,
    private messageService: MessageService,
    private actionsService: ActionsService
  ) {}

  public ngOnInit(): void {
    this.loading = true;
    this.actionsService.observeActions().subscribe({
      next: () => {
        this.menuService.handle('disabled', 'undo', !this.actionsService.hasBack());
        this.menuService.handle('disabled', 'redo', !this.actionsService.hasForward());
      }
    });
    this.settingsService.observeSettings().subscribe({
      next: settings => {
        this.settings = settings;
        document.getElementById('themeApp')?.setAttribute('href', '/assets/themes/' + this.settings.theme + '/theme.css');
        this.translationProvider = settings.translationProviders && settings.translationProviders.length
          ? settings.translationProviders[0]
          : undefined
        ;
        this.menuService.handle('disabled', 'upload', this.settings.webhook ? false : true);
      }
    })
    this.projectService.observeProject().subscribe({
      next: project => {
        this.project = project;
        this.loading = false;
        this.menuService.handle('disabled', ['project', 'clear'], project ? false : true);
        this.menuService.handle('disabled', 'export', project?.nodes?.length ? false : true);
        if (project?.nodes?.length) {
          this.actionsService.newAction(project?.nodes);
        }
        this.title.setTitle('PowerOn Translate' + (project ? ' - ' + project.name : ''));
      }
    });

    this.projectService.observeSelection().subscribe({
      next: selection => {
        for (const node of selection) {
          node.data.breadcrumbs = this.getBreadcrumbs(node);
        }
        this.selection = selection;
        const translationActive = this.selection.length !== 1 ||
          this.selection[0].children?.length || !this.translationProvider
        ;
        this.menuService.handle('disabled', 'translate', translationActive)
      }
    });
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.projectService.initializeProject();
    });
  }

  public open(): void {
    this.menuService.handle('trigger', 'open');
  }

  public create(): void {
    this.menuService.handle('trigger', 'new');
  }

  public getBreadcrumbs(node: TreeNode): MenuItem[][] {
    let result: MenuItem[][] = [];
    if (node.children?.length) {
      for (const child of node.children) {
        result = result.concat(this.getBreadcrumbs(child));
      }
    } else {
      result.push(this.getBreadcrumb(node));
    }

    return result;
  }

  public getBreadcrumb(node: TreeNode): MenuItem[] {
    const breadcrumb: MenuItem[] = [];
    const addresses = node.key?.split('.') as string[];
    const fullAddress = [];
    while (addresses.length) {
      const address = addresses.shift() as string;
      fullAddress.push(address);
      breadcrumb.push({
        label: address,
        icon: addresses.length == 0 ? 'far fa-rectangle-list mr-2' : 'far fa-folder-open mr-2 text-yellow-500',
        command: this.handleSelection.bind(this, fullAddress.join('.'))
      })
    }

    return breadcrumb;
  }

  public handleSelection(address: string): void {
    this.projectService.setSelectionAddress(address);
  }

  public handleTranslated(event: any, translation: POTTranslation): void {
    event?.preventDefault();
    const key = event?.key ? event.key - 1 : 0;

    if (translation.code === this.project?.primary || !translation.suggestions
      || !translation.suggestions.length || !translation.suggestions[key] || !this.translationProvider
    ) {
      return;
    }
    const t = translation.suggestions[key];
    translation.value = this.translationProvider.capitalize
      ? t.charAt(0).toLocaleUpperCase(translation.code) + t.slice(1)
      : t
    ;
    this.projectService.updateProject();
  }

  public suggestTranslation(translation: POTTranslation, node: TreeNode): void {
    const translations: POTTranslation[] = node.data.translations;
    const primary = this.project?.primary as string;
    if (translation.code == primary || this.suggesting || !this.translationProvider) {
      this.suggestions = [];
      return;
    }
    if (translation.suggestions) {
      this.suggestions = translation.suggestions;
      return;
    }
    this.suggesting = true;
    this.getTranslationSuggestions(translation, translations.find(t => t.code == primary)?.value as string)
      .then(suggestions => {
        this.suggestions = suggestions;
        translation.suggestions = this.suggestions;
        this.errorSuggest = false;
        this.suggesting = false;
      })
      .catch(() => {
        this.suggesting = false;
        this.errorSuggest = true;
      })
    ;
  }

  private getTranslationSuggestions(translation: POTTranslation, q: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      if (this.translationProvider?.name == 'google') {
        this.googleTranslateService.configure(this.translationProvider);
        const request = { q, target: translation.code, source: this.project?.primary as string, format: 'text' };
        this.googleTranslateService.translate(request).subscribe({
          next: response => {
            resolve(response.data.translations?.map((t: any) => t.translatedText));
          },
          error: (error: HttpErrorResponse) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error traducir al idioma (' + translation.code + ')' ,
              detail: 'Respuesta del servidor (' + error.message + ')'
            });
            reject();
          }
        });
      } else {
        throw Error('Servicio con nombre (' + this.translationProvider?.name + ') no existe en la versión de su proyecto.');
      }
    });
  }

  public handleTranslationAll(): void {
    if (this.translating || !this.project || !this.selection.length || this.selection.length > 1 || this.selection[0].children?.length) {
      return;
    }
    const node = this.selection[0];
    const translations: POTTranslation[] = node.data.translations;
    const q = translations.find(translation => translation.code == this.project?.primary)?.value;
    if (!q) {
      return;
    }
    this.translating = true;
    let translated = 0;
    this.menuService.handle('loading', 'translate', true);
    for (const translation of translations.filter(translation => translation.code !== this.project?.primary)) {
      this.getTranslationSuggestions(translation, q)
        .then(suggestions => {
          translation.suggestions = suggestions;
          this.handleTranslated(undefined, translation);
          translated ++;
          if (translated == translations.length - 1) {
            this.translating = false;
            this.menuService.handle('loading', 'translate', false);
            this.messageService.add({ severity: 'success', detail: 'Traducción en masa realizada con éxito', summary: 'Traducción exitosa' });
          }
        })
      ;
    }
  }

  public handleTranslation(translation: POTTranslation, node: TreeNode): void {
    this.projectService.updateProject();

    if (translation.code == this.project?.primary) {
      (node.data.translations as POTTranslation[])?.map(translation => translation.suggestions = undefined);
    }
  }

  public showSettings(): void {
    this.menuService.handle('trigger', 'settings');
  }

  public handleResize(panel: 'main' | 'content', event: any): void {
    if (!this.settings) {
      return;
    }
    this.settings.splitters[panel] = event.sizes;
    this.settingsService.setSettings(this.settings);
    if (this.project) {
      this.project.settings = this.settings;
      this.projectService.updateProjectSettings(this.settings);
    }
  }
}
