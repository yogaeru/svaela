import type { VNode } from "../contract/AbstracNode.ts";
import type { EventMap } from "./event.ts";

export type ChildVNode = VNode;

export type PropsVNode = {
    'id'?: string,
    'className'?: string,
    'content'?: string,   
    'event'?: EventMap
}

