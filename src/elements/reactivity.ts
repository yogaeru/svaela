const effectStack: Function[] = [];
let activeEffect: Function | null = null;

const targetMap = new Map<string, Set<Function>>();

// Effect Lifecycle Function
export function effect(callback: Function) {
  // console.log("Creating new effect");
  
  const mountEffect = () => {
    // console.log("Mounting effect");   
    effectStack.push(mountEffect);
    activeEffect = mountEffect;

    try {
      callback();
    } catch (error) {
      console.error("<---- ERROR ----> \n", error);
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  };
  mountEffect();
}

// Create State Functuion
export function createSignal<T>(data: T) {
  let value: T = data;
  const key = Symbol("key");
  
  // getter
  const get = () => {
    // console.log("Getting value:", value);
    if (activeEffect) track(key);
    return value;
  };

  // setter
  get.set = (newValue: T) => {
    // console.log("Setting value:", newValue);
    value = newValue;
    trigger(key);
  };

  return get;
}

//  Track Function to add effect to target Map
function track(key: any) {
  let dep = targetMap.get(key);
  if (!dep) {
    // console.log("Creating new dependency set for key:", key);
    targetMap.set(key, (dep = new Set()));
  }
  dep.add(activeEffect!);
}

// Trigger Function to notify all effects in dependency set
function trigger(key: any) {
  let dep = targetMap.get(key);
  if (!dep) return;
  dep.forEach((effect) => effect());
}
