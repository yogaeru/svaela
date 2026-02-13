import { Svander } from "./Svander";
import type { Svagation } from "./Svagation";
import { VNode } from "../modules/node/Node";

export class Svaela {
  element: Svagation | VNode;
  outlet: HTMLElement | null;
  renderer: Svander;

  constructor(element: Svagation, outlet: HTMLElement | null) {
    if (!outlet || outlet === null) {
      throw new Error("Outlet was null !! Please input valid outlet");
    }
    this.element = element;
    this.outlet = outlet;
    this.renderer = new Svander(this.outlet, element);
  }

  mount() {
    this.renderer.render();

    return this;
  }
}
