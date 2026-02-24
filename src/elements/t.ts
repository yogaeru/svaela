import { tags } from "./constants";
import { VNode } from "./Node";
import { effect } from "../../src";

import type {
  ChildArgument,
  ChildVNode,
  PropsVNode,
  HTMLTagFactory,
} from "./types";

/**
 * Genrate HTML Tags Factory
 **/
export const t: HTMLTagFactory = {} as HTMLTagFactory;

for (const tag of tags) {
  t[tag] = (...data: ChildArgument): VNode => {
    const props = data[0] as PropsVNode;
    // const children = data;
    const child: ChildVNode[] = data
      .flat(1)
      .map(
        (node: string | ChildVNode | PropsVNode): PropsVNode | ChildVNode => {
          if (typeof node === "string") return t.text(node);
          return node;
        },
      )
      .filter(
        (node: PropsVNode | ChildVNode): node is VNode | Node =>
          node !== undefined && (node instanceof VNode || node instanceof Node),
      );

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

t.text = (data: string): Text => {
  return document.createTextNode(data);
};

t.bind = (value: any) => {
  let currentNode: any;

  effect(() => {
    const stringData: string = String(value());
    const text: Text = document.createTextNode(stringData);
    // console.log("Binding value:", value);
    // console.log("String:", stringData);
    // console.log("Text:", currentNode);

    if (!currentNode) {
      currentNode = text;
    } else {
      currentNode.textContent = stringData;
    }
  });

  return currentNode;
};
