import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";

type Reducer<T> = (t: T) => T;
type Mutator<T> = T | Reducer<T>;
type MutatorFunction<T> = (t: Mutator<T>) => void;
type ObserverCallback = () => void;
type Key = string | string[];

const StateContext = createContext<StateClient | undefined>(undefined);

export class StateClient {
  private state: Record<string, unknown> = {};
  private observers: Record<string, Set<ObserverCallback>> = {};

  private static serializeKey(key: Key) {
    return Array.isArray(key) ? key.join(".") : key;
  }

  // Subscribe to the providedKey, call the updateFunction if it changes (with no arguments)
  subscribe = (providedKey: Key, updateFunction: ObserverCallback) => {
    const key = StateClient.serializeKey(providedKey);
    if (!this.observers[key]) {
      this.observers[key] = new Set<ObserverCallback>(); // WeakSet would be better, but they can't be iterated upon
    }
    this.observers[key].add(updateFunction);
  };

  // Unubscribe from the providedKey, needs the updateFunction used for subscription
  unsubscribe = (
    providedKey: Key | undefined,
    updateFunction: ObserverCallback
  ) => {
    if (!providedKey) return;
    const key = StateClient.serializeKey(providedKey);
    if (!this.observers[key]) {
      console.error("Unsubscribing from a key without listeners", key);
      return;
    }
    this.observers[key].delete(updateFunction);
  };

  // set a key to a value or use a reducer to set the value, and trigger all the subscriptions
  set = (providedKey: Key, mutator: Mutator<unknown>) => {
    const key = StateClient.serializeKey(providedKey);

    // Update state
    if (typeof mutator === "function") {
      this.state[key] = mutator(this.state[key]);
    } else {
      this.state[key] = mutator;
    }

    // Call all the observers
    if (this.observers[key]) {
      const observers = Array.from(this.observers[key]);
      for (const observerCallback of observers) {
        observerCallback();
      }
    }
  };

  // Set a key to a value; this doesn't call the subscribers
  initialize = (providedKey: Key, value: unknown) => {
    const key = StateClient.serializeKey(providedKey);
    this.state[key] = value;
  };

  // Get the value for a key
  get = <T,>(providedKey: Key) => {
    const key = StateClient.serializeKey(providedKey);
    return this.state[key] as T;
  };

  // Get true if the value was set or initialized before, false otherwise
  has = (providedKey: Key) => {
    const key = StateClient.serializeKey(providedKey);
    return Object.prototype.hasOwnProperty.call(this.state, key);
  };
}

interface StateClientParams {
  client: StateClient;
  children: React.ReactNode;
}

export function StateClientProvider({ client, children }: StateClientParams) {
  return (
    <StateContext.Provider value={client}>{children}</StateContext.Provider>
  );
}

export function useSyncState<T>(
  key: string | string[],
  initialValue: T
): [T, MutatorFunction<T>] {
  const stateClient = useContext(StateContext);

  if (!stateClient) {
    throw new Error("No StateClientProvider specified");
  }

  const { subscribe, unsubscribe } = stateClient;

  // DIY forceRefresh
  const stateSetter = useState({})[1];
  // This function identifies the hook "instance", as its ref is unique to this hook's lifecycle
  const updateFunction = useCallback(() => stateSetter({}), [stateSetter]);
  // Mutator callback: memoizes the key until it changes, so we don't recreate a function every time
  const mutatorCallback = useCallback<MutatorFunction<T>>(
    (mutator: Mutator<T>) => stateClient.set(key, mutator),
    [key, stateClient]
  );

  useEffect(() => {
    // Subscribe to the new key and unsubscribe from the old
    subscribe(key, updateFunction);
    return () => unsubscribe(key, updateFunction);
  }, [key, updateFunction, subscribe, unsubscribe]);

  if (!stateClient.has(key)) {
    stateClient.initialize(key, initialValue);
  }

  return [stateClient.get(key) as T, mutatorCallback];
}
