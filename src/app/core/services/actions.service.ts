import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TreeNode } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  private nodes: TreeNode[][] = [];
  private pointer: number = 0;
  private subject: Subject<void> = new Subject();
  constructor() {}

  public back(): TreeNode[] {
    if (!this.hasBack()) {
      return [];
    }
    this.pointer --;
    return this.nodes[this.pointer];
  }

  public forward(): TreeNode[] {
    if (!this.hasForward()) {
      return [];
    }
    this.pointer ++;
    return this.nodes[this.pointer];
  }

  public hasBack(): boolean {
    return this.nodes.length > 0 && this.pointer > 0;
  }

  public hasForward(): boolean {
    return this.nodes.length > 0 && this.pointer < this.nodes.length - 1;
  }

  public observeActions(): Observable<void> {
    return this.subject.asObservable();
  }

  public newAction(nodes: TreeNode[]): void {
    if (this.nodes.length - 1 > this.pointer) {
      this.nodes = this.nodes.slice(0, this.pointer);
    }
    this.nodes.push(this.cloneNodes(nodes));
    this.pointer = this.nodes.length - 1;
    this.subject.next();
  }

  private cloneNodes(nodes: TreeNode[]): TreeNode[] {
    const cloned: TreeNode[] = [];
    for (const node of nodes) {
      const clonedNode: TreeNode = { ...node };
      if (clonedNode.children) {
        clonedNode.children = this.cloneNodes(clonedNode.children);
      }
      cloned.push(clonedNode);
    }
    return cloned;
  }
}
