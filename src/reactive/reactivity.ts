// effect stack to support nested components
const effectStack: Function[] = [];
let activeEffect: Function | null = null;

export function reactive<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target: T, key: string | symbol) {
      console.log(`GET CALLED: [${String(key)}] `);
      if (activeEffect) track(target, key);
      return target[key as keyof T];
    },
    set(target: T, key: string | symbol, value) {
      target[key as keyof T] = value;
      trigger(target, key);
      console.log(`SET CALLED: [${String(key)}] [${target}]`);
      return true;
    },
  });
}

//
// dependency map
//
const targetMap = new WeakMap<object, Map<string | symbol, Set<Function>>>();

//
// Track
//
function track(target: object, key: string | symbol) {
  console.log(`TRACK CALLED: [${String(key)}] [${target}]`);
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect!);
}

//
// Trigger
//
function trigger(target: object, key: string | symbol) {
  console.log(`TRIGGER CALLED: [${String(key)}] [${target}]`);
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (!dep) return;
  dep.forEach((fn) => fn());
}

//
// Effect
//
export function effect(fn: Function) {
  console.log(`EFFECT CALLED: [${String(fn.name)}]`);

  const effectFn: Function = () => {
    // push current effect onto stack for nested support
    effectStack.push(effectFn);
    console.log(`EFFECT STACK PUSHED: [${String(fn.name)}]`);
    activeEffect = effectFn;
    try {
      fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  };
  effectFn();
}
