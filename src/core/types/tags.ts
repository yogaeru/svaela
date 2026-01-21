import type { VNode } from '../contract/AbstracNode.ts';
import type { PropsVNode } from './props.ts';

export const tags = [
    'div',
    'nav',
    'span',
    'main',
    'header',
    'button',
    'input',
    'form',
    'section',
    'footer',
    'p',
    'a',
    'ul',
    'li',
    'h1',
    'h2',
    'h3'
] as const ;

export type HTMLTag = typeof tags[number];

export type HTMLTagFactory = {
    [K in HTMLTag]: (props?: PropsVNode) => VNode 
} & {
    html: (tag: string, porps?: PropsVNode) => VNode
}