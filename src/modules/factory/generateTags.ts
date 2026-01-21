import { SvaNode } from '../node/Node.ts';

import type { PropsVNode } from '../../core/types/props.ts';
import {type HTMLTagFactory, tags} from '../../core/tags.ts'


/**
 * Genrate HTML Tags Factory
 **/
export const t = {} as HTMLTagFactory;

for (const tag of tags) {
    t[tag] = (args?: PropsVNode): SvaNode => {
        return new SvaNode(tag)
    }
}

t.html = (tag: string, props?: PropsVNode   ): SvaNode => {
    return new SvaNode(tag, props)
}

