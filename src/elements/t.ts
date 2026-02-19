import { tags } from "./constants";
import { VNode } from "./Node";
import { createTextVNode } from "./TextVNode";

import type {
  ChildVNode,
  PropsVNode,
  HTMLTagFactory,
  TextVNode,
} from "./types";

/**
 * Genrate HTML Tags Factory
 **/
export const t: HTMLTagFactory = {} as HTMLTagFactory;

for (const tag of tags) {
  t[tag] = (
    props?: PropsVNode,
    ...children: Array<string | ChildVNode | ChildVNode[]>
  ): VNode => {
    const child: ChildVNode[] = children
      .flat(1)
      .filter((node: ChildVNode | string): boolean => node !== undefined)
      .map((node: ChildVNode | string): ChildVNode => {
        if (typeof node === "string") return createTextVNode(node);
        return node;
      });

    return new VNode(tag, props).addChild(child);
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

t.text = (data: string): TextVNode => {
  return createTextVNode(data);
};



