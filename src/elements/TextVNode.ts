import type { TextVNode, TextNodeInstance } from "./types";

export const createTextVNode: TextNodeInstance = (data: string): TextVNode => {
  const textData: string = data;
  return {
    text: (): string => textData,
    render: (): Text => document.createTextNode(textData),
  };
};
