import type { VNode } from "./Node";
import { tags, eventList } from "./constants";

//
// VNode Types
//
export type ChildArgument = Array<
  PropsVNode | string | ChildVNode | ChildVNode[]
>;
export type ChildVNode = VNode | Node;
export type PropsVNode = {
  id?: string;
  className?: string;
  content?: string;
  events?: EventMap;
};

//
// TextVNode Types
//
export type TextNodeInstance = (data: string) => TextVNode;
export type TextVNode = {
  set: (data: string) => void;
  text: () => string;
  render: () => Text;
};

//
// Tags Types
//
export type HTMLTag = (typeof tags)[number];
export type HTMLTagFactory = {
  [K in HTMLTag]: (
    ...data: Array<PropsVNode | string | ChildVNode | ChildVNode[]>
  ) => VNode;
} & {
  html: (tag: string, porps?: PropsVNode) => VNode;
  link: () => HTMLAnchorElement;
  text: (data: string) => Text;
  bind: (data: any) => any;
  binding: (value: any) => any;
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

// Reactivity Related type
export type Signal = {
  (): any,
  set: (newValue: any) => void,
}