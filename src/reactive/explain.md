# Svaela Reactivity System

## Global Variables

```ts
state = reactive({ count: number });
effectStack = [];        // Stack of effects that will be executed
activeEffect = null;
targetMap = {
  // target is the raw object or
  // original object created in reactive()
  // example: { count: number }
  [target]: { [key]: Set<fn> }
};
```

## `createComponent`

```ts
export function createComponent(setup: () => () => VNode): () => VNode {
  return (): VNode => {
    let currentVNode: VNode;
    // each invocation runs setup fresh → new reactive state per instance
    const render: () => VNode = setup();

    effect((): void => {
      const newVNode: VNode = render();
      if (!currentVNode) {
        currentVNode = newVNode;
      } else {
        currentVNode.patch(newVNode);
      }
    });

    return currentVNode!;
  };
}
```

## Global Variable State (at rest)

| Variable       | Value                                  |
| -------------- | -------------------------------------- |
| `effectStack`  | `[]`                                   |
| `activeEffect` | `null`                                 |
| `targetMap`    | `{ {count}: { count: Set<fn>() } }`   |

---

## 1. First Mount

1. **`createComponent` called**
   - `currentVNode = null`
   - `const render: () => VNode` (returned by `setup()`)
   - `effect` called → argument is the mount function (example name: `mount()`)

2. **Inside `effect`** *(example case: Counter)*
   - `effectFn` pushed to `effectStack` → `effectStack = [counterEffect]`
   - Set `activeEffect = counterEffect`
   - **`mount()` called**
     - VNode is rendered
     - **State read** → `get` trap in Proxy is called
       - Check whether `activeEffect` exists
       - **If there is an active effect:**
         - Call `track(target: object, key: string | symbol)`
           > On first mount, `targetMap` entry for `target` (`{realObj}`) will be `undefined`.
           - `depsMap = targetMap.get(target)` → first time: `undefined`
             - If `undefined`: create `depsMap = new Map()` and set `targetMap.set(target, depsMap)`
           - `dep = depsMap.get(key)` → first time: `undefined`
             - If `undefined`: create `dep = new Set()` and set `depsMap.set(key, dep)`
           - Push `activeEffect` into `dep`
           - **`targetMap` state after tracking:**
             ```ts
             targetMap = {
               { count }: {
                 "count": Set(counterEffect)
               }
             }
             ```
     - **First time mount:** set `currentVNode` to the rendered VNode → `currentVNode = VNode`
     - **Subsequent runs:** patch/update the old VNode with the new VNode

3. **Cleanup after `effect` runs**
   - Pop last entry from `effectStack` → `effectStack = []`
   - Set `activeEffect = null`

---

## 2. Set State (Reactivity Trigger)

- Example: `state.count++`
- The `set` trap in the Proxy is called → `set(target, key, value)`

1. **Update the value**
   - `target[key] = value`

2. **Call `trigger(target, key)`**
   - `depsMap = targetMap.get(target)`
     → value: `{ "count": Set(counterEffect) }`
     - If no `depsMap` → `return`
   - `dep = depsMap.get(key)`
     → value: `Set(counterEffect)`
     - If no `dep` → `return`
   - **Run all stored functions** in the `dep` Set (re-runs the effect, which re-renders the component)
