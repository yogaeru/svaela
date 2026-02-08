import { Svander } from "./Svander";
import type { Svagation } from "./Svagation";
import type { VNode } from "../contract/AbstracNode";

export class Svaela {
  element: Svagation | VNode;
  outlet: HTMLElement;
  renderer: Svander;

  constructor(element: Svagation, outlet: HTMLElement) {
    this.element = element;
    this.outlet = outlet;
    this.renderer = new Svander(this.outlet, element);
  }

  mount() {
    this.renderer.render();
  
    return this;
  }
}
