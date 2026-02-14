import { VNode } from "./Node";
import { tags } from "./tags";

// 
// VNode Types
// 
export type ChildVNode = VNode | TextNode | Text;
export type PropsVNode = {
    'id'?: string,
    'className'?: string,
    'content'?: string,   
    'events'?: EventMap
}

// 
// TextVNode Types 
// 
export type TextNode = {
  toString: () => string,
  render: () => Text
}

export type TextNodeFunction = (data: string) => TextNode;


// 
// Tags Types
// 
export type HTMLTag = (typeof tags)[number];
export type HTMLTagFactory = {
  [K in HTMLTag]: (props?: PropsVNode, ...children: ChildVNode[]) => VNode;
} & {
  html: (tag: string, porps?: PropsVNode) => VNode,
  link: () => HTMLAnchorElement,
  text: (data: string) => Text;
};


//
// Event Types
//
const eventList = [
  "click",
  "dblclick",
  "mousedown",
  "mouseup",
  "mouseover",
  "mouseout",
  "mousemove",
  "keydown",
  "keyup",
  "keypress",
  "submit",
  "change",
  "input",
  "focus",
  "blur",
] as const;
type EventType = (typeof eventList)[number];
type EventHandler = (event: Event) => void;
type EventObject = {
  name: EventType;
  handler: EventHandler;
};
type EventMap = EventObject | Array<EventObject>;