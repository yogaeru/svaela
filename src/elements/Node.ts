import type { PropsVNode, ChildVNode } from "./types";

export class VNode {
  private _tag: string;
  private _props: PropsVNode | undefined;
  private _children: ChildVNode[] = [];
  private _document: Document = window.document;

  constructor(tag: string, props?: PropsVNode) {
    this._tag = tag;
    this._props = props;
  }

  // Getters
  get tag(): string {
    return this._tag;
  }
  get props(): PropsVNode {
    return this._props || {};
  }
  get children(): ChildVNode[] {
    return this._children;
  }

  // Methods
  child(children: ChildVNode | ChildVNode[]): this {
    if (Array.isArray(children)) {
      if (children.length === 0) {
        return this;
      }

      this._children.push(...children);
      return this;
    }
    this._children.push(children);
    return this;
  }

  render(): HTMLElement {
    // creatd element html based on tag
    const el: HTMLElement = this._document.createElement(this._tag);

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

    // render child elements
    const childrenBody: Array<HTMLElement | Text> = this.renderChildren();

    // if no children, return element
    if (childrenBody.length === 0) return el;

    // if only one child, append directly
    if (childrenBody.length === 1) {
      const firstChild = childrenBody[0];
      if (firstChild) el.appendChild(firstChild);
      return el;
    }

    // if multiple children, use fragment to append
    const fragment: DocumentFragment = this._document.createDocumentFragment();
    for (const child of childrenBody) {
      fragment.appendChild(child);
    }

    el.appendChild(fragment);
    return el;
  }

  format(pretty: boolean = false): string {
    if (!pretty) {
      return this.toString();
    }

    const el = this.render();
    return this.pretty(el, 0);
  }

  protected pretty(el: HTMLElement, indent = 0): string {
    const space = "  ".repeat(indent);
    const tagName = el.tagName.toLowerCase();

    const textTag = el.cloneNode(true).childNodes[0]?.textContent?.trim();

    const result = {
      id: el.id ? `id="${el.id}"` : "",
      className: el.className ? `class="${el.className}"` : "",
      content: textTag ? `${textTag}` : "",
    };

    // no children
    if (el.children.length === 0) {
      return `${space}<${tagName} ${result.id} ${result.className}>${result.content}</${tagName}>`;
    }

    // console.log("children: ", el.children);

    const children = Array.from(el.children)
      .map((child) => this.pretty(child as HTMLElement, indent + 1))
      .join("\n");

    const finalString: string = [
      `${space}<${tagName} ${result.id} ${result.className}>`,
      ` ${space} ${result.content}`,
      children,
      `${space}</${tagName}>`,
    ].join("\n");

    return finalString;
  }

  protected toString(): string {
    // render children to string with outerHTML
    const childrenString = this.renderChildren()
      .map((child) => {
        if (child instanceof Text) {
          return `   ${child.textContent}`;
        }
        
        return `   ${child.outerHTML}`;
      })
      .join("");

    const el = `<${this.tag}>\n${childrenString}\n</${this.tag}>`;
    return el;
  }

  protected renderChildren(): Array<HTMLElement | Text> {
    // array to hold children elements
    const body: Array<HTMLElement | Text> = [];

    // if no children, return empty array
    if (this.children.length === 0) return body;

    // render each child and push to body array
    for (const child of this.children) {
      if (child instanceof Text) {
        body.push(child);
      } else {
        body.push(child.render());
      }
    }

    return body;
  }
}
