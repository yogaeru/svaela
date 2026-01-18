import type { Node, Props } from '../modules/node/Node';

export const tags: string[] = [
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
] as const;

export type HTMLTag = typeof tags[number];

export type HTMLTagFactory = {
    [K in HTMLTag]: (props?: Props) => Node 
} & {
    html: (tag: string, porps?: Props) => Node
}