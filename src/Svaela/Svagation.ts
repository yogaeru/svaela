import type { BranchRoute, Branch, BranchView } from './types';

export class Svagation {
  private branches: Branch = {};
  
  branch(route: BranchRoute) {
    const { path, ...elements } = route;
    this.branches[path] = elements;
    return this;
  }
  
  getBranches() {
    return this.branches;
  }
}





