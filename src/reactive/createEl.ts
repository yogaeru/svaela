import { VNode } from "../elements/Node";
import { effect } from "./reactivity";

// createComponent: returns a factory function so each call creates its own state & effect
export function createComponent(setup: () => () => VNode): () => VNode {
  return (): VNode => {
    let currentVNode: VNode;
    // each invocation runs setup fresh → new reactive state per instance
    const render: () => VNode = setup();

    effect((): void => {
      const newVNode: VNode = render();
      if (!currentVNode) {
        currentVNode = newVNode;
      } else {
        currentVNode.patch(newVNode);
      }
    });

    return currentVNode!;
  };
}
