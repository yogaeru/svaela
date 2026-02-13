import type { BranchRoute } from "./types";
import { Svagation } from "./Svagation";
import { VNode } from "../modules/node/Node";

export class Svander {
  svagationRoute: any;
  root: HTMLElement;

  constructor(root: HTMLElement, route: Svagation) {
    this.svagationRoute = route.getBranches();
    this.root = root;
  }
  
  // Render element to DOM
  render() {
    window.addEventListener("popstate", () => this._handleLocation());
    document.addEventListener("click", (event) => this._handleClick(event));
    this._handleLocation();
  }
  
  // Handle Path Normalization
  private normalizePath(path: string) {
    return path.replace(/\/+$/, "") || "/";
  }
  
  // Handle Location Change
  private _handleLocation() {
    const path = this.normalizePath(window.location.pathname);
    console.log("PATH: ", path);
    
    // Fetch the view function for the current path
    // 
    const viewFunction = this.svagationRoute[path] || (() => "NOT FOUND");
    if (!viewFunction) return;
    
    // content element returned by view function 
    //
    const content: HTMLElement | VNode | string = viewFunction();
    console.log("CONTENT: ", content);
    if (!content) return;
  
    // if type of view or element to display is VNode
    // 
    if (content instanceof VNode) {
      console.log('Rendering VNode');
      this.root.innerHTML = '';
      this.root.appendChild(content.render());
      return;
    }

    // if view or element to display is string of html element
    // 
    if (typeof content === "string") {
      // this.root.innerHTML = '';
      this.root.innerHTML = content;
      return;
    }

    this.root.appendChild(content);
  }
  
  /* Handle Click Event  */
  private _handleClick(event: PointerEvent) {
    // Handle click event logic here
    // 
    const target = event.target as HTMLElement;
    if (!target) return;
    // console.log("TARGET IS : ", target);

    const anchor = target.closest("a");
    if (!anchor) return;
    // console.log("ANCHOR IS : ", anchor);

    const href = anchor.getAttribute("href");
    if (!href) return;
    event.preventDefault();

    window.history.pushState({}, "", href);

    this._handleLocation();
    // console.log("HANDLE CLICK CLOSED");
  }
}
