import type { Child } from '../../core/node';

export type Props = Record<string, any>;

export class Node {
    tag: string;
    props: Props;
    children: Child[] = [];

    constructor(tag: string, props: Props = {}) {
        this.tag = tag;
        this.props = props;
    }

    // Overloads Contract
    child(children: Child): this;
    child(children: Child[]): this;

    // Implementation of Overloads Child Contract
    child(children: Child | Child[]): this {
        if (Array.isArray(children)) {
            this.children.push(...children);
            return this;
        }
        this.children.push(children);
        return this;
    }

    private renderChildren(): string {
        if(this.children.length === 0) return '';

        const body: string[] = [];
        
        for(const child of this.children) {
            if(typeof child === 'string') {
                body.push(child);
                continue;
            }

            body.push(child.render());
        }
        return body.join('');
    }

    render(): string{
        const childrenBody: string = this.renderChildren();

        return `<${this.tag}>${childrenBody}</${this.tag}>`;
    }
}