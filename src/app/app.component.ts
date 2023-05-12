import { Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService, TreeDragDropService, TreeNode } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ImportComponent } from './components/import/import.component';
import { AddComponent } from './components/add/add.component';
import { GoogleTranslateService } from './core/services/google.translate.service';
import { GoogleTranslateComponent } from './components/google.translate/google.translate.component';
import { LanguagesComponent } from './components/languages/languages.component';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [TreeDragDropService]
})
export class AppComponent implements OnInit {
  public theme!: string;
  public translations: TreeNode[] = [];
  public translationFields!: any[];
  public files: { [key: string]: any } = {};
  public principal!: string;
  public searchWords!: string;
  public searchTimeout!: any;
  public selected: TreeNode[] = [];
  public selectedAddress!: string;
  public copiedNodes: TreeNode[] = [];
  public cuttedNodes: TreeNode[] = [];
  public savedLabel!: string;
  public suggesting!: boolean;
  public errorSuggest!: boolean;
  public capitalizeTranslations!: boolean;
  public suggestions: { translatedText: string }[] = [];
  public googleConfigured!: boolean;
  public splitterSizes: {[key: string]: number[]} = { main: [25, 75], content: [75, 25] };
  public contextMenu: MenuItem[] = [
    { label: 'Agregar ID', icon: 'pi pi-plus-circle text-orange-500', command: this.add.bind(this) },
    { label: 'Editar', icon: 'pi pi-pencil text-green-500', command: this.editLabel.bind(this) },
    { label: 'Copiar', icon: 'pi pi-copy text-cyan-500', command: this.copyLabel.bind(this) },
    { label: 'Cortar', icon: 'pi pi-times text-yellow-500', command: this.cutLabel.bind(this) },
    { label: 'Pegar', icon: 'pi pi-check-circle text-blue-500', command: this.pasteLabel.bind(this), disabled: true },
    { separator: true },
    { label: 'Eliminar', icon: 'pi pi-trash text-pink-500', command: this.removeLabel.bind(this) },
  ];
  public menu: MenuItem[] = [
    {
      label: 'Archivo',
      icon: 'pi pi-file',
      items: [
        { label: 'Importar', icon: 'pi pi-file-import', command: this.import.bind(this) },
        { label: 'Exportar', icon: 'pi pi-file-export', command: this.export.bind(this) },
        { label: 'Nuevo', icon: 'pi pi-plus', command: this.newProject.bind(this) }
      ]
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      items: [
        {
          label: 'Tema',
          icon: 'pi pi-palette',
          items: [
            { icon: 'pi pi-sun', label: 'Claro', id: 'nova', command: this.changeTheme.bind(this, 'nova') },
            { icon: 'pi pi-moon', label: 'Oscuro', id: 'mdc-dark-deeppurple', command: this.changeTheme.bind(this, 'mdc-dark-deeppurple') }
          ]
        },
        { label: 'Lenguajes', icon: 'pi pi-language', command: this.configureLanguages.bind(this) },
        { label: 'Traductor de google', icon: 'pi pi-google', command: this.configureGoogle.bind(this) }
      ]
    },
    {
      title: 'Agregar ID',
      icon: 'pi pi-plus-circle',
      command: this.add.bind(this)
    },
    {
      title: 'Eliminar',
      icon: 'pi pi-trash',
      command: this.removeLabel.bind(this)
    },
    {
      title: 'Traducir todo',
      icon: 'pi pi-bolt',
      command: this.translateAll.bind(this)
    },
    {
      title: 'Importar',
      icon: 'pi pi-file-import',
      command: this.import.bind(this)
    },
    {
      title: 'Exportar',
      icon: 'pi pi-file-export',
      command: this.export.bind(this)
    },
    {
      title: 'Guardar',
      icon: 'pi pi-save',
      command: this.update.bind(this)
    }
  ];

  @HostListener('window:keydown.control.f', ['$event'])
  public focusSearch(e: KeyboardEvent) {
    e.preventDefault();
    const el: any = document.querySelector('.p-tree-filter.p-inputtext');
    el?.focus();
  }
  @HostListener('window:keydown.control.p', ['$event'])
  public focusPrincipalLanguage(e: any) {
    e.preventDefault();
    const el: any = document.querySelector('.principal-language');
    el?.focus();
  }
  @HostListener('window:keydown.control.j', ['$event'])
  public addLabelShortCut(e: any) {
    console.log('sape');
    e.preventDefault();
    this.add();
  }
  @HostListener('window:keydown.control.a', ['$event'])
  public translateAll(e: any) {
    e.preventDefault();
    if (this.translationFields.length == 1 && this.translationFields[0].node.children.length == 0) {
      const q = this.translationFields[0].translations.find((t: any) => t.lng == this.principal).value[this.translationFields[0].label];
      if (!q) {
        return;
      }
      for (const item of this.translationFields[0].translations) {
        if (item.lng === this.principal) {
          continue;
        }
        this.googleTranslateService.translate({ q, target: item.lng, source: this.principal, format: 'text' }).subscribe({
          next: response => {
            const t: string = response.data.translations[0]?.translatedText;
            item.value[this.translationFields[0].label] = this.capitalizeTranslations
              ? t.charAt(0).toLocaleUpperCase(item.lng) + t.slice(1)
              : t
            ;
            this.update();
          }
        });
      }
    }
  }

  constructor(
    private messageService: MessageService,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private dragDropService: TreeDragDropService,
    private googleTranslateService: GoogleTranslateService
  ) {}

  public ngOnInit(): void {
    this.theme = localStorage.getItem('POTTheme') || 'nova';
    this.capitalizeTranslations = localStorage.getItem('POTCapitalizeTranslations') ? true : false;
    this.googleConfigured = this.googleTranslateService.getKey() ? true : false;
    this.changeTheme(this.theme);
    try {
      this.splitterSizes = localStorage.getItem('POTSplitterSizes')
        ? JSON.parse(localStorage.getItem('POTSplitterSizes') as string)
        : this.splitterSizes
      ;
    } catch (e) {}

    try {
      const stored = localStorage.getItem('POTTranslations')
        ? JSON.parse(localStorage.getItem('POTTranslations') as string)
        : null
      ;
      this.principal = stored?.principal;
      this.files = stored?.translations;
    } catch (e) {
      localStorage.removeItem('POTTranslations');
    }
    this.configureTranslations();
    try {
      const selected = localStorage.getItem('POTSelected')
        ? JSON.parse(localStorage.getItem('POTSelected') as string)
        : []
      ;
      for (const address of selected) {
        const n = this.findNode(this.translations, address);
        if (n) {
          this.expandParent(n);
          this.selected.push(n);
        }
      }
      this.handleSelection();
    } catch (e) {
      localStorage.removeItem('POTSelected');
    }
    this.dragDropService.dragStop$.subscribe({
      next: data => {
        const target = data.subNodes?.find(n => n.children?.find(n => n.key == data.node?.key));
        const node = data.node;
        const k = node?.key?.split('.');
        k?.pop();
        const parent = this.findNode(this.translations, k?.join('.') as string);
        if (node) {
          for (const lng in this.files) {
            const targetLabel = this.findLabel(this.files[lng], target?.key as string);
            const nodeLabel = this.findLabel(this.files[lng], node?.key as string)
            if (targetLabel && target) {
              targetLabel[target.label as string][node.label as string] = nodeLabel[node?.label as string];
            } else {
              this.files[lng][node.label as string] = nodeLabel[node?.label as string];
            }

            if (target?.key !== parent?.key) {
              delete nodeLabel[node?.label as string];
            }

            if (parent?.children?.length == 0) {
              const parentLabel = this.findLabel(this.files[lng], parent?.key as string);
              parentLabel[parent.label as string] = '';
            }
          }
        }
        this.update();
      }
    });
  }

  public newProject(): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de crear un nuevo proyecto?, esto eliminará el proyecto en curso',
      header: 'Comenzar un nuevo proyecto',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Aceptar',
      acceptIcon: 'pi pi-exclamation-triangle mr-2',
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.selected = [];
        this.files = {};
        localStorage.removeItem('POTTranslations');
        localStorage.removeItem('POTSelected');
        this.translations = [];
        this.principal = '';
      },
    });
  }

  public add(): void {
    const lastIndex = this.selected.length -1;
    const ref = this.dialogService.open(AddComponent, {
      width: '550px',
      header: 'Agregar ID',
      data: {
        selected: lastIndex !== -1 ? this.selected[lastIndex] : null
      }
    });

    ref.onClose.subscribe({
      next: addr => {
        if (addr) {
          const address: string[] = addr.split('.');
          const sp: string[] = addr.split('.');
          for (const lng in this.files) {
            sp[sp.length - 1] = this.getLabelName(this.files[lng], address.join('.'), sp[sp.length - 1]);
            address[address.length - 1] = sp[sp.length - 1];
            let h: string[] = [];
            let lastParent: any;
            for (const [i, s] of sp.entries()) {
              h.push(s);
              const f = this.findLabel(this.files[lng], h.join('.'));
              if (!f && typeof lastParent !== 'undefined') {
                if (i === sp.length - 1) {
                  if (typeof lastParent !== 'object') {
                    const ap = [...sp];
                    ap.pop();
                    const parent = this.findLabel(this.files[lng], ap.join('.'));
                    if (parent) {
                      parent[ap[ap.length - 1]] = {};
                      parent[ap[ap.length - 1]][s] = '';
                      if (lastParent) {
                        const l = s == sp[sp.length - 2] ? sp[sp.length - 2] + ' (Copia 1)' : sp[sp.length - 2];
                        parent[ap[ap.length - 1]][l] = lastParent;
                      }
                    }
                  } else {
                    lastParent[s] = '';
                  }
                } else {
                  lastParent[s] = {};
                  lastParent = lastParent[s];
                }
              } else if (i < sp.length - 1) {
                if (f) {
                  lastParent = f[s];
                } else {
                  this.files[lng][s] = {};
                  lastParent = this.files[lng][s];
                }
              } else if (i == sp.length - 1 && !f && typeof lastParent == 'undefined') {
                this.files[lng][s] = '';
              }
            }
          }
          this.update();
          const node = this.findNode(this.translations, address.join('.'));
          if (node) {
            this.handleSelection(node);
          }
        }
      }
    });
  }

  public pasteLabel(): void {
    if (!this.selected || this.selected.length == 0 || (this.copiedNodes.length == 0 && this.cuttedNodes.length == 0)) {
      return;
    }
    const nodes: TreeNode[] = this.cuttedNodes.length > 0 ? this.cuttedNodes : this.copiedNodes;
    const lastIndex = this.selected.length - 1;

    let label: string = '';
    let address: string[] = [];
    for (const node of nodes) {
      address = this.selected[lastIndex].key?.split('.') as string[];
      address.push(node.label as string);
      for (const lng in this.files) {
        const nodeObject = { ...this.findLabel(this.files[lng], node.key as string) };
        if (this.cuttedNodes) {
          const cuttedNodeIndex = this.cuttedNodes.findIndex(n => n.key === node.key);
          if (cuttedNodeIndex !== -1) {
            const object = this.findLabel(this.files[lng], this.cuttedNodes[cuttedNodeIndex].key as string);
            if (object) {
              delete object[this.cuttedNodes[cuttedNodeIndex].label as string];
            }
          }
        }
        label = this.getLabelName(this.files[lng], address.join('.'), node.label as string);
        const object = this.findLabel(this.files[lng], this.selected[0].key as string);
        if (object) {
          object[this.selected[0].label as string][label] = nodeObject[node.label as string];
        }
      }
    }
    this.update();
    this.contextMenu[4].disabled = true;
    address[address.length - 1] = label;
    const newNode = this.findNode(this.translations, address.join('.'));
    if (newNode) {
      this.handleSelection(newNode);
    }
    this.cuttedNodes = [];
    this.copiedNodes = [];
  }

  public editLabel(): void {
    if (!this.selected || this.selected.length == 0) {
      return;
    }
    this.selected[this.selected.length - 1].type = 'edit';
    this.savedLabel = this.selected[this.selected.length - 1].label as string;
    setTimeout(() => {
      const el: any = document.getElementById('editLabel');
      el?.focus();
      el?.select();
    });
  }

  public processEdit(): void {
    if (!this.selected || this.selected.length == 0) {
      return;
    }
    const lastIndex = this.selected.length - 1;
    this.selected[lastIndex].type = undefined;
    if (!this.selected[lastIndex].label || this.selected[lastIndex].label === this.savedLabel) {
      this.selected[lastIndex].label = this.savedLabel;
      return;
    }
    const address: any = this.selected[lastIndex].key?.split('.');
    address[address.length - 1] = this.selected[lastIndex].label;
    for (const lng in this.files) {
      this.selected[lastIndex].label = this.getLabelName(this.files[lng], address.join('.'), this.selected[lastIndex].label as string);
      address[address.length - 1] = this.selected[lastIndex].label;
      const object = this.findLabel(this.files[lng], this.selected[lastIndex].key as string);
      if (object) {
        object[this.selected[lastIndex].label as string] = object[this.savedLabel];
        delete object[this.savedLabel];
      }
    }

    this.selected[lastIndex].key = address.join('.');
    this.selected[lastIndex].children?.forEach(child => {
      const address: string[] = child.key?.split('.') as string[];
      address[0] = this.selected[lastIndex]?.label as string;
      child.key = address.join('.');
    });

    this.update();
    const node = this.findNode(this.translations, this.selected[lastIndex].key as string);
    if (node) {
      this.handleSelection(node);
    }
  }

  public handleEditInput(event: any): void {
    if (event.key == 'Escape') {
      setTimeout(() => {
        if (!this.selected || this.selected.length == 0) {
          return;
        }
        const lastIndex = this.selected.length - 1;
        this.selected[lastIndex].type = undefined;
        this.selected[lastIndex].label = this.savedLabel;
      })

    } else if (event.key == 'Enter') {
      setTimeout(() => {
        this.processEdit();
      });
    }
  }

  public cutLabel(): void {
    if (!this.selected || this.selected.length == 0) {
      return;
    }
    this.copiedNodes = [];
    this.cuttedNodes = this.selected;
    this.cuttedNodes.map(n => n.styleClass = 'po-cutted');
    this.contextMenu[4].disabled = false;
    this.messageService.add({ severity: 'success', detail: 'Corte realizado con éxito', summary: 'Corte exitoso' });
  }

  public copyLabel(): void {
    if (!this.selected || this.selected.length == 0) {
      return;
    }
    this.copiedNodes = this.selected;
    if (this.cuttedNodes) {
      this.cuttedNodes.map(n => n.styleClass = undefined);
      this.cuttedNodes = [];
    }
    this.contextMenu[4].disabled = false;
    this.messageService.add({ severity: 'success', detail: 'La etiqueta fue copiada con éxito', summary: 'Copia exitosa' });
  }

  public removeLabel(): void {
    if (!this.selected || this.selected.length == 0) {
      return;
    }

    this.confirmationService.confirm({
      message: this.selected.length > 1
        ? '¿Está seguro de eliminar todas las etiquetas seleccionadas?'
        : '¿Está seguro de eliminar la etiqueta'
          + (this.selected[0].children && this.selected[0].children?.length > 0 ? ' y todos sus elementos' : '') + '?'
      ,
      header: 'Eliminar etiqueta "' + this.selected[0].key + '"',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      acceptIcon: 'pi pi-trash mr-2',
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: 'Cancelar',
      accept: () => {
        if (this.selected.length == 0) {
          return;
        }
        let addrs: string[] = [];
        const nodes = [ ...this.selected ];
        this.selected = [];
        for (const node of nodes) {
          for (const lng in this.files) {
            const label = this.findLabel(this.files[lng], node.key as string);
            if (label) {
              delete label[node.label as string];
            }
            addrs = node.key?.split('.') as string[];
            addrs.pop();
            const parentLabel = this.findLabel(this.files[lng], addrs.join('.'));
            if (parentLabel) {
              if (Object.keys(parentLabel[addrs[addrs.length - 1]]).length == 0) {
                parentLabel[addrs[addrs.length - 1]] = '';
              }
            }
          }
        }
        this.update();

        if (addrs.length > 0) {
          const parentNode = this.findNode(this.translations, addrs.join('.'));
          if (parentNode) {
            this.handleSelection(parentNode);
          }
        }

      },
    });
  }

  public export(): void {
    if (!this.principal) {
      return;
    }

    const iterable = Object.keys(this.files);
    try {
      for (const lng of iterable) {
        const link = document.createElement('a');

        link.setAttribute('download', lng + '.json');
        link.setAttribute('target', '_blank');
        link.style.display = 'none';

        document.body.appendChild(link);
        const json = JSON.stringify(this.files[lng], null, '\t');
        const uri = "data:text/json;charset=UTF-8," + encodeURIComponent(json);
        link.setAttribute('href', uri);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
      this.messageService.add({ severity: 'error', detail: 'No se pudo descargar un archivo', summary: 'Error al exportar' });
    }
  }

  public import(): void {
    const ref = this.dialogService.open(ImportComponent, {
      header: 'Importar lenguajes',
      width: '550px',
      data: {
        files: this.files
      }
    });

    ref.onClose.subscribe({
      next: result => {
        if (result) {
          this.principal = result.principal;
          this.files = result.translations;
          this.update();
        }
      }
    });
  }

  public handleSelection(node?: TreeNode): void {
    if (node) {
      this.selected = [node];
      this.expandParent(node);
    }
    if (!this.selected || this.selected.length == 0) {
      return;
    }
    const lastIndex = this.selected.length -1;
    if (this.selectedAddress && this.selected[lastIndex].key == this.selectedAddress) {
      return;
    }
    try {
      localStorage.setItem('POTSelected', JSON.stringify(this.selected.map(n => n.key)));
    } catch (e) {}
    this.selectedAddress = this.selected[lastIndex].key as string;
    this.translationFields = [];
    const nodes = this.selected.length == 1 && this.selected[0].children && this.selected[0].children.length > 0
      ? this.selected[0].children
      : this.selected
    ;
    const sortable = Object.keys(this.files);
    const index = sortable.indexOf(this.principal);
    sortable.splice(index, 1);
    sortable.unshift(this.principal);

    for (const node of nodes) {
      const translations = [];

      for (const lng of sortable) {
        translations.push({
          lng,
          id: lng + '-' + node.label,
          value: this.findValue(node.key as string, this.files[lng])
        });
      }
      const address: string[] = node.key?.split('.') as string[];
      const breadcrumb: MenuItem[] = [];
      const length = address.length;
      for (let i = 0; i < length; i++) {
        if (address.length > 0) {
          const n = this.findNode(this.translations, address.join('.'));
          if (n) {
            breadcrumb.unshift({
              label: n.label,
              icon: n?.children && n.children.length > 0 ? 'pi pi-folder-open mr-2 text-yellow-500' : 'pi pi-book mr-2',
              command: this.handleSelection.bind(this, n)
            });
          }
        }
        address.pop();
      }
      this.translationFields.push({
        label: node.label,
        breadcrumb,
        node,
        translations
      });
    }
  }

  public handleTranslated(event: any, item: any): void {
    event.preventDefault();
    const key = event.key - 1;
    if (item.lng !== this.principal && item.suggestions && item.suggestions[key]) {
      const t = item.suggestions[key].translatedText;
      item.value[this.translationFields[0].label] = this.capitalizeTranslations
        ? t.charAt(0).toLocaleUpperCase(item.lng) + t.slice(1)
        : t
      ;
      this.update();
    }
  }

  private expandParent(node: TreeNode): void {
    const address: string[] = node.key?.split('.') as string[];
    node.expanded = true;
    if (address && address.length > 0) {
      address.pop();
      const parent = this.findNode(this.translations, address.join('.'));
      if (parent) {
        this.expandParent(parent);
      }
    }
  }

  private findValue(address: string, value: any): any {
    if (typeof value == 'object') {
      const split: string[] = address.split('.');
      const find: string = split.shift() as string;
      const object = find in value ? value : null;
      if (object) {
        if (split.length == 0) {
          return object;
        } else {
          return this.findValue(split.join('.'), object[find]);
        }
      }
    }
  }

  public findLabel(object: any, address: string): any {
    const a = address?.split('.') || [];
    const find = a.shift() as string;
    if (typeof object !== 'object') {
      return;
    }
    const element: any = find in object ? object : null;
    if (a.length == 0) {
      return find in object ? object : null;
    }
    if (!element) {
      return;
    }

    return this.findLabel(element[find], a.join('.'));
  }

  public findNode(nodes: TreeNode[], address: string): TreeNode | void {
    const a = address.split('.');
    const find = a.shift() as string;
    const element: TreeNode | undefined = nodes.find(n => n.label === find);
    if (a.length == 0) {
      return element;
    }
    if (!element || element.children?.length == 0) {
      return;
    }

    return this.findNode(element.children as TreeNode[], a.join('.'));
  }

  public configureTranslations(): void {
    if (!this.files) {
      return;
    }
    const sortable = Object.keys(this.files[this.principal]);
    sortable.sort();
    this.translations = [];
    for (const t of sortable) {
      this.translations.push(this.getTranslationTreeNode(t, this.files[this.principal][t]))
    }

    for (const node of this.selected) {
      this.expandParent(node);
    }
  }

  private getTranslationTreeNode(label: string, value: any, parentAddress?: string): TreeNode {
    const children: TreeNode[] = []
    if (typeof value == 'object') {
      const sortable = Object.keys(value);
      sortable.sort();
      for (const child of sortable) {
        children.push(this.getTranslationTreeNode(child, value[child], parentAddress ? parentAddress + '.' + label : label));
      }
    }
    const key = (parentAddress ? parentAddress + '.' : '') + label;
    const data = children.length ? '' : this.getDataValue(key);
    const node: TreeNode = {
      expanded: this.selected.find(n => n.key === key) ? true : false,
      label,
      children,
      data,
      key,
      icon: children.length ? 'pi pi-folder-open text-yellow-500' : 'pi pi-book',
    }

    return node;
  }

  public getDataValue(address: string): string {
    let result = '';
    const l = address.split('.');
    const s = l[l.length - 1];
    for (const lng in this.files) {
      const label = this.findLabel(this.files[lng], address);
      if (label) {
        result += ' ' + label[s]
      }
    }

    return result;
  }

  public changeTheme(theme: string): void {
    this.theme = theme || 'nova';
    const menu: any = this.menu;
    const themes: MenuItem[] = menu.find((item: MenuItem) => item.label == 'Configuración')?.items[0]?.items;
    themes.forEach(item => {
      item.styleClass = item.id === theme ? 'active' : '';
    });

    document.getElementById('themeApp')?.setAttribute('href', '/assets/themes/' + this.theme + '/theme.css');
    localStorage.setItem('POTTheme', theme);
  }

  public suggestTranslation(item: any): void {
    if (item.lng == this.principal || this.suggesting || !this.googleTranslateService.getKey()) {
      this.suggestions = [];
      return;
    }
    if (item.suggestions) {
      this.suggestions = item.suggestions;
      return;
    }
    this.suggesting = true;
    const q = this.translationFields[0].translations.find((t: any) => t.lng == this.principal).value[this.translationFields[0].label];
    this.googleTranslateService.translate({ q, target: item.lng, source: this.principal, format: 'text' }).subscribe({
      next: response => {
        this.suggestions = response.data.translations;
        item.suggestions = this.suggestions;
        this.errorSuggest = false;
        this.suggesting = false;
      },
      error: () => {
        this.suggesting = false;
        this.errorSuggest = true;
      }
    });
  }

  public handleTranslation(lng: string): void {
    if (lng == this.principal) {
      this.translationFields[0].translations.map((t: any) => t.suggestions = null);
    }
    this.update();
  }

  public configureLanguages(): void {
    const ref = this.dialogService.open(LanguagesComponent, {
      header: 'Configuración de idiomas',
      width: '550px',
      data: {
        files: this.files,
        principal: this.principal
      }
    });

    ref.onClose.subscribe({
      next: result => {
        if (result) {
          this.files = result.files;
          this.principal = result.principal;
          this.update();
        }
      }
    });
  }

  public configureGoogle(): void {
    const ref = this.dialogService.open(GoogleTranslateComponent, {
      header: 'Configurar Google Translate',
      width: '550px'
    });
    ref.onClose.subscribe({
      next: () => {
        this.googleConfigured = this.googleTranslateService.getKey() ? true : false;
      }
    });
  }

  public update(): void {
    try {
      localStorage.setItem('POTTranslations', JSON.stringify({ principal: this.principal, translations: this.files }));
      this.configureTranslations();
    } catch (e) {
      this.messageService.add(
        { severity: 'error', detail: 'No se pudo guardar los cambios, revise el campo modificado', summary: 'Error al guardar'}
      );
    }
  }

  public handleResize(panel: string, event: any): void {
    this.splitterSizes[panel] = event.sizes;
    try {
      localStorage.setItem('POTSplitterSizes', JSON.stringify(this.splitterSizes));
    } catch (e) {}

  }

  public handleCapitalize(): void {
    localStorage.setItem('POTCapitalizeTranslations', this.capitalizeTranslations ? '1' : '0');
  }

  private getLabelName(object: any, addr: string, label: string): string {
    const address: string[] = addr.split('.');
    let exist = this.findLabel(object, address.join('.'));
    let i: number = 0;
    let newLabel: string = label;
    while (exist) {
      i++;
      newLabel = label + ' (copia ' + i.toString() + ')';
      address[address.length - 1] = newLabel;
      exist = this.findLabel(object, address.join('.'));
    }

    return newLabel;
  }
}
