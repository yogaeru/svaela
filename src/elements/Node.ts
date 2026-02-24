import type { PropsVNode, ChildVNode } from "./types";

export class VNode {
  el: HTMLElement | null = null;
  tag: string;
  props: PropsVNode | undefined;
  children: ChildVNode[];
  eventList: Array<object> = []

  constructor(tag: string, props?: PropsVNode) {
    this.tag = tag;
    this.props = props;
    this.children = [];
  }

  //
  // add child method
  //
  addChild(...children: Array<ChildVNode | ChildVNode[]>): this {
    // console.log("Adding child:", children);
    const child: Array<ChildVNode | Node> = children
      .flat(1)
      .filter((node: ChildVNode | Node): boolean => node != undefined);

    this.children.push(...child);
    return this;
  }

  //
  // render VNode into HTMLElement
  //
  render(): HTMLElement {
    // created element html based on tag
    const el: HTMLElement = document.createElement(this.tag);
    this.el = el;

    // attach props
    if (this.props) {
      const { id, className, content, events } = this.props;
      // console.log("props: ", this.props);

      if (id) el.id = id;
      if (className) el.classList.add(className);
      if (content) el.textContent = content;
      if (events) {
        if (Array.isArray(events)) {
          for (const event of events) {
            const { name, handler } = event;
            el.addEventListener(name, handler);
          }
        } else {
          const { name, handler } = events;
          el.addEventListener(name, handler);
        }
      }
    }

    // rendered  child elements
    const childrenBody: Node[] = this.renderChildren();

    // if no children, return element
    if (childrenBody.length === 0) return el;

    // if only one child, append directly
    if (childrenBody.length === 1) {
      const firstChild = childrenBody[0];
      if (firstChild) el.appendChild(firstChild);
      return el;
    }

    // if multiple children, use fragment to append
    const fragment: DocumentFragment = document.createDocumentFragment();
    for (const child of childrenBody) {
      fragment.appendChild(child);
    }

    el.appendChild(fragment);
    return el;
  }

  //
  // Patch Node
  //
  patch(newVNode: VNode) {
    if (!this.el) return;

    // jika tag beda → replace total
    if (this.tag !== newVNode.tag) {
      const newEl = newVNode.render();
      this.el.replaceWith(newEl);
      return;
    }

    const el = this.el;
    newVNode.el = el;

    // Update text content jika ada
    if (newVNode.props?.content !== this.props?.content) {
      el.textContent = newVNode.props?.content || "";
    }

    // simple children replace (belum diffing pintar)
    el.innerHTML = "";

    for (const child of newVNode.children) {
      if (typeof child === "string") {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      } else {
        el.appendChild(child.render());
      }
    }

    // update reference
    this.children = newVNode.children;
    this.props = newVNode.props;
  }
  
  // 
  // Add event listener to element
  // 
  on(eventName: string, handler: Function): this {
    this.eventList.push({eventName, handler});
    return this;
  }
  
  
  //
  // Format VNode into a string
  //
  format(pretty: boolean = false): string {
    if (!pretty) {
      return this.toString();
    }

    const el = this.render();
    return this.pretty(el, 0);
  }

  //
  // Format VNode into a pretty string
  //
  private pretty(element: Node, indent = 0): string {
    if (element instanceof Text) {
      return `${" ".repeat(indent)}${element.textContent}`;
    }

    if (element instanceof HTMLElement) {
      const space = " ".repeat(indent);
      const tagName = element.tagName.toLowerCase();

      const id = element.id ? ` id="${element.id}"` : "";
      const className = element.className
        ? ` class="${element.className}"`
        : "";

      const children = Array.from(element.childNodes)
        .map((child: ChildNode): string => this.pretty(child, indent + 1))
        .join("\n");

      const finalString: string = [
        `${space}<${tagName}${id}${className}>`,
        children,
        `${space}</${tagName}>`,
      ].join("\n");

      return finalString;
    }

    return "";
  }

  //
  // to string node
  //
  private toString(): string {
    // render children to string with outerHTML
    const childrenString = this.renderChildren()
      .map((child) => {
        if (child instanceof Text) {
          return `   ${child.textContent}`;
        } else if (child instanceof HTMLElement) {
          return `   ${child.outerHTML}`;
        }
      })
      .join("");

    const el = `<${this.tag}>\n${childrenString}\n</${this.tag}>`;
    return el;
  }

  //
  // render children in VNode to array of HTMLElement
  //
  private renderChildren(): Node[] {
    // array to hold children elements
    const body: Node[] = [];

    // console.log("ARRAY OF CHILDREN", this.children)

    // if no children, return empty array
    if (this.children.length === 0) return body;

    // render each child and push to body array
    for (const child of this.children) {
      if (typeof child === "string") {
        body.push(document.createTextNode(child));
        continue;
      } else if (child instanceof Node) {
        body.push(child);
        continue;
      }
      // console.log("CHILDREN", child);
      body.push(child.render());
    }
    return body;
  }
}
