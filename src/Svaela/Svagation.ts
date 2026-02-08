import type { BranchRoute, Branch, BranchView } from './types';

export class Svagation {
  private branches: Branch = {};
  
  getBranches() {
     return this.branches;
   }
  
  branch(route: BranchRoute) {
    this.addBranches(route);
    
    return this;
  }
  
  private addBranches(route: BranchRoute, parentPath= '') {
    const { path, view, children } = route;
    const fullPath: string = this.concatPath(parentPath, path);
    // console.log('Parent Path: ', parentPath);
    // console.log('Child Path: ', path);
    // console.log('Full Path: ', fullPath);
    
    this.branches[fullPath] = view;
    
    if (children) {
      for (const childRoute of children) {
        this.addBranches(childRoute, fullPath);
      }
    }
  }
  
  private concatPath(parentPath: string, childPath: string) {
    return (
      '/' +
      [parentPath, childPath]
        .filter(Boolean)
        .map((path: string): string => path.replace(/^\/+|\/+$/, ''))
        .filter(Boolean)
        .join('/')
    )
  }
 }
