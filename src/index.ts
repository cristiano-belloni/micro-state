import { useCallback, useState, useEffect } from "react";

type Reducer<T> = (t: T) => T;
type Mutator<T> = T | Reducer<T>;
type MutatorFunction<T> = (t: Mutator<T>) => void;
type ObserverCallback = () => void;
type Key = string | (string | number)[];

function serializeKey(key: Key) {
  return Array.isArray(key) ? key.join(".") : key;
}

export function createMicroState() {
  const state: Record<string, unknown> = {};
  const observers: Record<string, Set<ObserverCallback>> = {};

  // Subscribe to the providedKey, call the updateFunction if it changes (with no arguments)
  function subscribe(providedKey: Key, updateFunction: ObserverCallback) {
    const key = serializeKey(providedKey);
    if (!observers[key]) {
      observers[key] = new Set<ObserverCallback>(); // WeakSet would be better, but they can't be iterated upon
    }
    observers[key].add(updateFunction);
  }

  // Unubscribe from the providedKey, needs the updateFunction used for subscription
  function unsubscribe(
    providedKey: Key | undefined,
    updateFunction: ObserverCallback
  ) {
    if (!providedKey) return;
    const key = serializeKey(providedKey);
    if (!observers[key]) {
      console.error("Unsubscribing from a key without listeners", key);
      return;
    }
    observers[key].delete(updateFunction);
  }

  // Set a key to a value or use a reducer to set the value, and trigger all the subscriptions
  function set(providedKey: Key, mutator: Mutator<unknown>) {
    const key = serializeKey(providedKey);

    // Update state
    if (typeof mutator === "function") {
      state[key] = mutator(state[key]);
    } else {
      state[key] = mutator;
    }

    // Call all the observers
    if (observers[key]) {
      const observerArray = Array.from(observers[key]);
      for (const observerCallback of observerArray) {
        observerCallback();
      }
    }
  }

  // Set a key to a value; this doesn't call the subscribers
  function initialize(providedKey: Key, value: unknown) {
    const key = serializeKey(providedKey);
    state[key] = value;
  }

  // Get the value for a key
  function get<T>(providedKey: Key): T {
    const key = serializeKey(providedKey);
    return state[key] as T;
  }

  // Get true if the value was set or initialized before, false otherwise
  function has(providedKey: Key) {
    const key = serializeKey(providedKey);
    return Object.prototype.hasOwnProperty.call(state, key);
  }

  function useMicroState<T>(
    key: Key,
    initialValue: T
  ): [T, MutatorFunction<T>] {
    // DIY forceRefresh
    const stateSetter = useState({})[1];
    // This function identifies the hook "instance", as its ref is unique to this hook's lifecycle
    const updateFunction = useCallback(() => stateSetter({}), [stateSetter]);
    // Mutator callback: memoizes the key until it changes, so we don't recreate a function every time
    const mutatorCallback = useCallback<MutatorFunction<T>>(
      (mutator: Mutator<T>) => set(key, mutator),
      [key]
    );

    useEffect(() => {
      // Subscribe to the new key and unsubscribe from the old
      subscribe(key, updateFunction);
      return () => unsubscribe(key, updateFunction);
    }, [key, updateFunction, subscribe, unsubscribe]);

    if (!has(key)) {
      initialize(key, initialValue);
    }

    return [get(key) as T, mutatorCallback];
  }

  return { subscribe, unsubscribe, set, initialize, get, has, useMicroState };
}

export function createMicroStateHook() {
  return createMicroState().useMicroState;
}

export type MicroState = ReturnType<typeof createMicroState>;
