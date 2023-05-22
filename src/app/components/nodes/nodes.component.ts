import { Component, HostListener, OnInit } from '@angular/core';
import { ConfirmationService, MenuItem, TreeNode } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { POTNodeMenu } from 'src/app/core/lib/node.menu';
import { POTProject } from 'src/app/core/models/project';
import { MenuService } from 'src/app/core/services/menu.service';
import { ProjectService } from 'src/app/core/services/project.service';
import { AddComponent } from '../add/add.component';
import { ActionsService } from 'src/app/core/services/actions.service';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit {
  public nodes: TreeNode[] = [];
  public copied: TreeNode[] = [];
  public cutted: TreeNode[] = [];
  public selection: TreeNode[] = [];
  public project!: POTProject | undefined;
  public menu = POTNodeMenu;
  @HostListener('window:keydown.control.i', ['$event'])
  public addShortCut(e: any) {
    e?.preventDefault();
    this.add();
  }
  @HostListener('window:keydown.control.k', ['$event'])
  public focusSearch(e: KeyboardEvent) {
    e.preventDefault();
    const el: any = document.querySelector('.p-tree-filter.p-inputtext');
    el?.focus();
  }
  @HostListener('window:keydown.control.z', ['$event'])
  public undoShortCut(e?: any) {
    e?.preventDefault();
    this.undo();
  }

  @HostListener('window:keydown.control.y', ['$event'])
  public redoShortCut(e?: any) {
    e?.preventDefault();
    this.redo();
  }

  constructor(
    private menuService: MenuService,
    private projectService: ProjectService,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private actionsService: ActionsService
  ) {}

  public ngOnInit(): void {
    this.menuService.observeBehavior().subscribe({
      next: behavior => {
        const ids: string[] = Array.isArray(behavior.id) ? behavior.id : [behavior.id];
        const items: MenuItem[] = this.menu.filter(item => ids.indexOf(item.id as string) > -1);
        switch (behavior.type) {
          case 'disabled': items.map(item => item.disabled = behavior.value); break;
          case 'command': items.map(item => item.command = behavior.value); break;
        }
      }
    });

    this.projectService.observeProject().subscribe({
      next: project => {
        this.project = project;
        if (project) {
          this.nodes = project.nodes
          this.menuService.handle('disabled', 'add', !project.languages.length);
          if (project.selection.length) {
            this.selection = (project.selection.map(address => this.findNode(this.nodes, address)) as TreeNode[]).filter(node => node);
            this.handleSelection(undefined, true);
          }
        }
      }
    });

    this.projectService.observeSelectionAddress().subscribe({
      next: address => {
        const node = this.findNode(this.nodes, address);
        if (node) {
          this.handleSelection(node);
        }
      }
    });

    this.menuService.handle('command', 'copy', this.copy.bind(this));
    this.menuService.handle('command', 'cut', this.cut.bind(this));
    this.menuService.handle('command', 'paste', this.paste.bind(this));
    this.menuService.handle('command', 'remove', this.remove.bind(this));
    this.menuService.handle('command', 'add', this.add.bind(this));
    this.menuService.handle('command', 'edit', this.edit.bind(this));
    this.menuService.handle('command', 'undo', this.undo.bind(this));
    this.menuService.handle('command', 'redo', this.redo.bind(this))

    this.projectService.observeUpdate().subscribe({
      next: () => {
        this.projectService.updateProjectNode(this.nodes);
      }
    });
  }

  public handleDrop(event: any): void {
    const sourceNode: TreeNode = event.dragNode;
    const targetNode: TreeNode = event.dropNode;
    const parentNode: TreeNode | undefined = targetNode.children?.find(node => node.key === sourceNode.key)
      ? targetNode
      : undefined
    ;

    sourceNode.key = (parentNode ? parentNode.key + '.' : '') + sourceNode.label;
    this.updateChildrenKey(sourceNode.children, sourceNode);
    if (sourceNode.parent && !sourceNode.parent.children?.length) {
      sourceNode.parent.icon = 'far fa-rectangle-list';
    }
    if (targetNode.icon === 'far fa-rectangle-list') {
      targetNode.icon = 'far fa-folder-open text-yellow-500';
    }
    this.projectService.updateProjectNode(this.nodes);
  }

  public undo(): void {
    const nodes = this.actionsService.back();
    if (nodes.length) {
      this.nodes = nodes;
      this.projectService.updateProjectNode(nodes, true);
    }
    this.menuService.handle('disabled', 'undo', !this.actionsService.hasBack());
    this.menuService.handle('disabled', 'redo', !this.actionsService.hasForward());
  }

  public redo(): void {
    const nodes = this.actionsService.forward();
    if (nodes.length) {
      this.nodes = nodes;
      this.projectService.updateProjectNode(nodes, true);
    }
    this.menuService.handle('disabled', 'undo', !this.actionsService.hasBack());
    this.menuService.handle('disabled', 'redo', !this.actionsService.hasForward());
  }

  public add(): void {
    if (!this.project?.languages.length) {
      return;
    }
    const ref = this.dialogService.open(AddComponent, {
      width: '550px',
      header: 'Nuevo ID',
      data: {
        address: this.selection.length ? this.selection[this.selection.length - 1].key : null
      }
    });

    ref.onClose.subscribe({
      next: (address: string[]) => {
        if (address) {
          const key = [];
          let nodes = this.nodes;
          while (address.length) {
            let label = address.shift() as string;
            key.push(label);
            let node = this.findNode(this.nodes, key.join('.'));
            if (node && !address.length) {
              label = this.getLabelName(nodes, label);
              key[key.length - 1] = label;
              node = undefined;
            }
            if (!node) {
              node = {
                label,
                key: key.join('.'),
                icon: !address.length ? 'far fa-rectangle-list' : 'far fa-folder-open text-yellow-500',
                data: {
                  translations: address.length ? undefined : this.project?.languages.map(l => { return { code: l.code, value: '' } })
                },
                children: []
              }
              nodes.push(node);
            } else if (address.length && !node.children?.length) {
              node.icon = 'far fa-folder-open text-yellow-500';
            }
            nodes = node.children as TreeNode[];
          }
          this.projectService.updateProjectNode(this.nodes);
        }
      }
    });
  }

  public edit(): void {
    if (!this.project || this.selection.length == 0) {
      return;
    }
    const node = this.selection[this.selection.length - 1];
    node.type = 'edit';
    node.data.savedLabel = node.label;
    setTimeout(() => {
      const el: any = document.getElementById('editLabel');
      el?.focus();
      el?.select();
    });
  }

  public copy(): void {
    if (this.selection.length == 0) {
      return;
    }
    this.copied = this.selection;
    if (this.cutted) {
      this.cutted.map(n => n.styleClass = undefined);
      this.cutted = [];
    }
    this.menuService.handle('disabled', 'paste', false);
  }

  public cut(): void {
    if (!this.selection || this.selection.length == 0) {
      return;
    }
    this.copied = [];
    this.cutted = this.selection;
    this.cutted.map(n => n.styleClass = 'po-cutted');
    this.menuService.handle('disabled', 'paste', false);
  }

  public paste(): void {
    if (!this.project || this.selection.length == 0 || (!this.copied.length && !this.cutted)) {
      console.log('returneo');
      return;
    }
    const nodes: TreeNode[] = this.cutted.length > 0 ? this.cutted : this.copied;
    const targetNode: TreeNode = this.selection[this.selection.length - 1];
    for (const sourceNode of nodes) {
      const newNode = { ...sourceNode };
      if (!targetNode.children?.length) {
        targetNode.icon = 'far fa-folder-open text-yellow-500';
        targetNode.children = [];
      }
      newNode.label = this.getLabelName(targetNode.children, newNode.label as string);
      newNode.key = targetNode.key + '.' + newNode.label;
      newNode.parent = targetNode;
      newNode.styleClass = undefined;

      if (newNode.children) {
        newNode.children = this.cloneChildrens(newNode);
      }
      const parentNode = sourceNode.parent;


      targetNode.children.push(newNode);

      if (this.cutted.findIndex(n => n.key === sourceNode.key) !== -1) {
        const index = parentNode?.children?.findIndex(c => c.key === sourceNode.key);
        if (index !== -1) {
          parentNode?.children?.splice(index as number, 1);
        }
      }
    }
    this.menuService.handle('disabled', 'paste', true);
    this.projectService.updateProjectNode(this.nodes);
    this.cutted = [];
    this.copied = [];
  }

  public remove(): void {
    if (!this.project || this.selection.length == 0) {
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar todas las etiquetas seleccionadas?',
      header: 'Eliminar etiqueta' + (this.selection.length > 1 ? 's' : '"' + this.selection[0].key + '"'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      acceptIcon: 'pi pi-trash mr-2',
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: 'Cancelar',
      accept: () => {
        if (!this.project || this.selection.length == 0) {
          return;
        }
        for (const sourceNode of this.selection) {
          const parentChildren = sourceNode.parent ? sourceNode.parent.children : this.nodes;
          if (parentChildren) {
            const index = parentChildren.findIndex(node => node.key === sourceNode.key);
            parentChildren.splice(index as number, 1);
            if (parentChildren.length == 0 && sourceNode.parent) {
              sourceNode.parent.icon = 'far fa-rectangle-list';
            }
          }
        }
        this.selection = [];
        this.handleSelection();
        this.projectService.updateProjectNode(this.nodes);
      }
    });
  }

  private cloneChildrens(node: TreeNode): TreeNode[] | undefined {
    if (node.children?.length) {
      return [
        ...node.children.map(child => {
          const cloned = { ...child };
          cloned.key = node.key + '.' + cloned.label;
          if (cloned && cloned.children?.length) {
            child.children = this.cloneChildrens(cloned);
          }
          return cloned;
        })
      ];
    }
    return undefined;
  }

  public focusPrimary(event: any): void {
    const el: any = document.querySelector('.principal-language');
    el?.focus();
  }

  public handleContextMenu(event: any): void {
    this.handleSelection(event.node);
  }

  public handleSelection(node?: TreeNode, expand?: boolean): void {
    if (node) {
      this.selection = [node];
      this.expand(node);
    }
    this.menuService.handle('disabled', ['remove', 'copy', 'cut', 'edit'], this.selection.length == 0);
    if (this.selection.length == 0 || !this.project) {
      this.menuService.handle('disabled', 'paste', true);
      this.projectService.setSelection(this.selection);
      return;
    }
    if (expand) {
      for (const node of this.selection) {
        this.expand(node);
      }
    }
    this.projectService.setSelection(this.selection);
  }

  public handleEditInput(event: any): void {
    if (event.key == 'Escape') {
      event.stopPropagation();
      setTimeout(() => {
        if (!this.selection || this.selection.length == 0) {
          return;
        }
        const lastIndex = this.selection.length - 1;
        this.selection[lastIndex].type = undefined;
        this.selection[lastIndex].label = this.selection[lastIndex].data.savedLabel;
      })
    } else if (event.key == 'Enter') {
      setTimeout(() => {
        this.processEdit();
      });
    }
  }

  public processEdit(): void {
    if (!this.project || this.selection.length == 0) {
      return;
    }
    const sourceNode = this.selection[this.selection.length - 1];
    sourceNode.type = undefined;
    if (!sourceNode.label || sourceNode.label === sourceNode.data.savedLabel) {
      sourceNode.label = sourceNode.data.savedLabel;
      return;
    }
    const address: any = sourceNode.key?.split('.');
    const parentChildren = (
      sourceNode.parent
        ? sourceNode.parent.children
        : this.nodes
      )?.filter(node => node.key !== sourceNode.key) as TreeNode[]
    ;
    const label: string = this.getLabelName(parentChildren, sourceNode.label);
    address[address.length - 1] = label;
    sourceNode.key = address.join('.');
    this.updateChildrenKey(sourceNode.children, sourceNode);
    this.handleSelection();
    this.projectService.updateProjectNode(this.nodes);
  }

  private updateChildrenKey(children: TreeNode[] | undefined, parent: TreeNode): void {
    if (!children || !children.length) {
      return;
    }
    for (const child of children) {
      child.key = parent.key + '.' + child.label;
      this.updateChildrenKey(child.children, child);
    }
  }

  private findNode(nodes: TreeNode[], address: string): TreeNode | void {
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

  private expand(node: TreeNode): void {
    node.expanded = true;
    const address = node.key?.split('.') as string[];
    address.pop();
    if (address.length) {
      const parent = this.findNode(this.nodes, address.join('.'));
      if (parent) {
        this.expand(parent);
      }
    }
  }

  private getLabelName(nodes: TreeNode[], label: string): string {
    let exist = nodes.find(node => node.label === label);
    let newLabel: string = label;
    let i = 0;
    while (exist) {
      i++;
      newLabel = label + ' (copia ' + i.toString() + ')';
      exist = nodes.find(node => node.label == newLabel);
    }

    return newLabel;
  }
}
