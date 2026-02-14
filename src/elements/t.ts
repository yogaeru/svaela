import { VNode } from "./Node";
import { tags } from "./tags";
import type { ChildVNode, PropsVNode, HTMLTagFactory } from "./types";

/**
 * Genrate HTML Tags Factory
 **/
export const t: HTMLTagFactory = {} as HTMLTagFactory;

for (const tag of tags) {
  t[tag] = (props?: PropsVNode, ...children: ChildVNode[]): VNode => {
    const child: ChildVNode[]= children
      .flat(Infinity)
      .filter((node): boolean => node !== undefined);

    return new VNode(tag, props).child(child);
  };
}

t.html = (tag: string, props?: PropsVNode): VNode => {
  return new VNode(tag, props);
};

t.link = (): HTMLAnchorElement => {
  const anchor: HTMLAnchorElement = document.createElement("a");
  anchor.addEventListener("click", (e) => {
    e.preventDefault;
  });
  return anchor;
};

t.text = (data: string): Text => {
  const text: Text = document.createTextNode(data);
  return text;
}
