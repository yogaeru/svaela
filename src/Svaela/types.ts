export type BranchRoute = {
  path: string,
  view: HTMLElement | string,
  children?: BranchRoute[]; 
}

export type BranchView = Omit<BranchRoute, 'path'>;

export type Branch = Record<string, string | HTMLElement>;
