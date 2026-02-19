import type { VNode } from "../elements/Node";

export type ViewElement = () => HTMLElement | VNode | string;


export type BranchRoute = {
  path: string;
  view: ViewElement;
  children?: BranchRoute[];
};

// export type BranchView = Omit<BranchRoute, "path">;

export type Branch = Record<string, () => string | HTMLElement | VNode>;
 