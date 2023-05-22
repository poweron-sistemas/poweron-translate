import { Injectable } from '@angular/core';
import { POTProject } from '../models/project';
import { Observable, Subject } from 'rxjs';
import { TreeNode } from 'primeng/api';
import { SettingsService } from './settings.service';
import { POTSettings } from '../models/settings';
import { POTTranslation } from '../models/translation';
import { ActionsService } from './actions.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private version: string = '1.0.0';
  private projectSubject: Subject<POTProject | undefined> = new Subject();
  private selectionSubject: Subject<TreeNode[]> = new Subject();
  private selectionAddressSubject: Subject<string> = new Subject();
  private updateSubject: Subject<boolean> = new Subject();

  constructor(private settingsService: SettingsService, private actionsService: ActionsService) {}

  public initializeProject(): void {
    const project = this.extractProject();
    this.settingsService.setSettings(project ? project.settings : this.settingsService.extractSettings());
    this.projectSubject.next(project);
  }

  public setProject(project: POTProject | undefined): boolean {
    if (project) {
      this.projectSubject.next(project);
      return this.storeProject(project);
    }
    localStorage.removeItem('POTProject');
    this.projectSubject.next(project);
    return false;
  }

  public setSelection(nodes: TreeNode[]): boolean {
    const project = this.extractProject();
    if (!project) {
      return false;
    }
    project.selection = nodes.map(n => n.key as string);

    this.selectionSubject.next(nodes);
    return this.storeProject(project);
  }

  public setSelectionAddress(address: string): void {
    this.selectionAddressSubject.next(address);
  }

  public observeProject(): Observable<POTProject | undefined> {
    return this.projectSubject.asObservable();
  }

  public observeSelection(): Observable<TreeNode[]> {
    return this.selectionSubject.asObservable();
  }

  public observeSelectionAddress(): Observable<string> {
    return this.selectionAddressSubject.asObservable();
  }

  public observeUpdate(): Observable<boolean> {
    return this.updateSubject.asObservable();
  }

  public getVersion(): string {
    return this.version;
  }

  public updateProjectNode(nodes: TreeNode[], cancelStoreAction?: boolean): boolean {
    const project = this.extractProject();
    if (!project) {
      return false;
    }
    const newNodes: TreeNode[] = [];
    for (const node of nodes) {
      newNodes.push(this.getNodeData(node));
    }
    if (!cancelStoreAction) {
      this.actionsService.newAction(newNodes);
    }
    project.nodes = newNodes;
    return this.storeProject(project);
  }

  public updateProjectSettings(settings: POTSettings): boolean {
    const project = this.extractProject();
    if (!project) {
      return false;
    }
    project.settings = settings;
    return this.storeProject(project);
  }

  public updateProject(cancelStoreAction?: boolean): void {
    this.updateSubject.next(cancelStoreAction || false);
  }

  private getNodeData(node: TreeNode): TreeNode {
    const children: TreeNode[] = [];
    for (const child of node?.children || []) {
      children.push(this.getNodeData(child));
    }
    return {
      icon: node.icon,
      label: node.label,
      data: node.data,
      key: node.key,
      expanded: node.expanded,
      children
    }
  }

  public parseLanguage(nodes: TreeNode[], code: string): {[key: string]: any} {
    const object: {[key: string]: any} = {};
    for (const node of nodes) {
      const translations: POTTranslation[] = node.data.translations;
      let value = translations && translations.length ? translations.find(translation => translation.code == code)?.value : '';
      object[node.label as string] =  node.children?.length ? this.parseLanguage(node.children, code) : (value || '');
    }
    return object;
  }

  private storeProject(project: POTProject): boolean {
    if (!project) {
      return false;
    }
    try {
      if (project) {
        localStorage.setItem('POTProject', JSON.stringify(project));
      } else {
        localStorage.removeItem('POTProject');
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public extractProject(): POTProject | undefined {
    const stored = localStorage.getItem('POTProject');
    let project!: POTProject | undefined;
    try {
      if (stored && stored !== 'null' && stored !== 'undefined') {
        project = JSON.parse(stored);
      }
    } catch (e) {}

    return project;
  }
}
