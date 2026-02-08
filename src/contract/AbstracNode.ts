import type { PropsVNode, ChildVNode } from "../types/props.ts";


export abstract class VNode {
    // protected abstract _tag: string;
    // protected abstract _props: Props | undefined;
    // protected abstract _children: Child[];
    // protected abstract _document: Document;

    /**
     * Get the HTML tag of this node.
     */
    abstract get tag(): string;
    /** 
     * Get the properties of this node.
     */
    abstract get props(): PropsVNode;

    /**
     * Get the children of this node.
     */
    abstract get children(): ChildVNode[];

    // Overloads Contract
    /**
     * Add a single child to this node.
     * @param child Single node
    **/
    abstract child(children: ChildVNode): this;

    /**
    * Add multiple children to this node.
    * @param child Array of nodes
    **/
    abstract child(children: ChildVNode[]): this;

    /**
     * @param pretty 
     * @returns Formatted HTML string
     * @example renderedNode.format(true) // Pretty formatted (default is false)
     */
    abstract format(pretty: boolean): string;

    /**
     * Render the VNode to an actual HTMLElement.
     * @example
     * const element: HTMLElement = VNode.render();
     * @returns HTMLElement representation of the VNode
     */
    abstract render(): HTMLElement;


    // Protected Methods for internal processing
    protected abstract pretty(el: HTMLElement, indent?: number): string;
    protected abstract toString(): string;
    protected abstract renderChildren(): HTMLElement[];
}