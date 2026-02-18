import type { VNode } from "./Node";
import { tags, eventList } from "./constants";

// 
// VNode Types
// 
export type ChildVNode = VNode | TextVNode | Node;
export type PropsVNode = {
    'id'?: string,
    'className'?: string,
    'content'?: string,   
    'events'?: EventMap
}

// 
// TextVNode Types 
// 
export type TextNodeInstance = (data: string) => TextVNode;
export type TextVNode = {
  text: () => string,
  render: () => Text
}


// 
// Tags Types
// 
export type HTMLTag = (typeof tags)[number];
export type HTMLTagFactory = {
  [K in HTMLTag]: (props?: PropsVNode, ...children: ChildVNode[]) => VNode;
} & {
  html: (tag: string, porps?: PropsVNode) => VNode,
  link: () => HTMLAnchorElement,
  text: (data: string) => TextVNode;
};


//
// Event Types
//
type EventType = (typeof eventList)[number];
type EventHandler = (event: Event) => void;
type EventObject = {
  name: EventType;
  handler: EventHandler;
};
type EventMap = EventObject | Array<EventObject>;