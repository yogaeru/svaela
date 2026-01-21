export const eventList = [
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mousemove',
    'keydown',
    'keyup',
    'keypress',
    'submit',
    'change',
    'input',
    'focus',
    'blur',
] as const;

export type EventType = typeof eventList[number];

export type EventHandler = (event: Event) => void;

export type EventMap = [EventType, EventHandler] | Array<[EventType, EventHandler]>;