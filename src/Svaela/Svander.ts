import type { BranchRoute } from "./types";
import { Svagation } from "./Svagation";

export class Svander {
  svagationRoute: any;
  root: HTMLElement;

  constructor(root: HTMLElement, route: Svagation) {
    this.svagationRoute = route.getBranches();
    this.root = root;
  }
  
  render() {
    window.addEventListener("popstate",() => this._handleLocation());
    document.addEventListener("click", (event) => this._handleClick(event));
    this._handleLocation();
  }
   
  private normalizePath(path: string) {
    return path.replace(/\/+$/, "") || "/"; 
  }
  
  private _handleLocation() {
    const path = this.normalizePath(window.location.pathname);
    console.log('PATH: ', path);
    
    
    const content = this.svagationRoute[path] || "NOT FOUND";
    if (!content) return;

    // const el = document.getElementById(this.root);
    // 
    if (typeof content === 'string') {
      // this.root.innerHTML = '';
      this.root.innerHTML = content;
      return;
    }
    
    this.root.appendChild(content);
  }

  private _handleClick(event: PointerEvent) {
    // Handle click event logic here
    console.log("Click event handled");
    const target = event.target as HTMLElement;
    console.log('TARGET IS : ', target);
    if (!target) return;

    const anchor = target.closest("a");
    if (!anchor) return;
    console.log('ANCHOR IS : ', anchor);

    const href = anchor.getAttribute("href");
    if (!href) return;
    event.preventDefault();


    window.history.pushState({}, "", href);
    
    this._handleLocation();
    console.log('HANDLE CLICK CLOSED')
  }
}
