import React, {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

type Reducer<T> = (t: T) => T;
type Mutator<T> = T | Reducer<T>;
type MutatorFunction<T> = (t: Mutator<T>) => void;
type ObserverCallback = () => void;
type Key = string | (string | number)[];

const StateContext = createContext<StateClient | undefined>(undefined);

export class StateClient {
  private state: Record<string, unknown> = {};
  private observers: Record<string, Set<ObserverCallback>> = {};
  private currentFakeRef = {}; // See https://jsperf.app/qobefi

  public static serializeKey(key: Key) {
    return Array.isArray(key) ? key.join(".") : key;
  }

  // Subscribe to the providedKey, call the updateFunction if it changes (with no arguments)
  subscribe = (providedKey: Key, updateFunction: ObserverCallback) => {
    console.debug("Subscribing to key", providedKey);
    const key = StateClient.serializeKey(providedKey);
    if (!this.observers[key]) {
      this.observers[key] = new Set<ObserverCallback>();
    }
    this.observers[key].add(updateFunction);
  };

  // Unubscribe from the providedKey, needs the updateFunction used for subscription
  unsubscribe = (
    providedKey: Key | undefined,
    updateFunction: ObserverCallback
  ) => {
    console.debug("Unsubscribing from key", providedKey);
    if (!providedKey) return;
    const key = StateClient.serializeKey(providedKey);
    if (!this.observers[key]) {
      console.error("Unsubscribing from a key without listeners", key);
      return;
    }
    this.observers[key].delete(updateFunction);
  };

  // Set a key to a value or use a reducer to set the value, and trigger all the subscriptions
  set = (providedKey: Key, mutator: Mutator<unknown>) => {
    const key = StateClient.serializeKey(providedKey);

    // Update state. This needs to be immutable because of how useSyncExternalStore works.
    const value =
      typeof mutator === "function" ? mutator(this.state[key]) : mutator;
    // This is faster than this.state = { ...this.state, [key]: value };
    // See https://jsperf.app/qobefi
    this.state[key] = value;
    this.currentFakeRef = {};

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
  get = <T,>(providedKey: Key): T => {
    const key = StateClient.serializeKey(providedKey);
    return this.state[key] as T;
  };

  // Get true if the value was set or initialized before, false otherwise
  has = (providedKey: Key) => {
    const key = StateClient.serializeKey(providedKey);
    return Object.prototype.hasOwnProperty.call(this.state, key);
  };

  // Get the current state. This is mainly used in useSyncExternalStore
  getUpdateReference = () => {
    return this.currentFakeRef;
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

export function useMicroState<T>(
  providedKey: Key,
  initialValue: T
): [T, MutatorFunction<T>] {
  const stateClient = useContext(StateContext);
  // We need to serialize the key here because it's used as a dependency in the callback for useSyncExternalStore
  // If it's an array, it will re-create the function every time the array gets re-created
  const key = StateClient.serializeKey(providedKey);

  if (!stateClient) {
    throw new Error("No StateClientProvider specified");
  }

  const { subscribe, unsubscribe, getUpdateReference } = stateClient;

  // This subscribes to the state and returns a cleanup function
  // It needs to be a callback because it's used in useSyncExternalStore
  const subscriber = useCallback(
    (callback: ObserverCallback) => {
      subscribe(key, callback);
      return () => unsubscribe(key, callback);
    },
    [key, subscribe, unsubscribe]
  );

  // This re-renders the component when the state changes
  useSyncExternalStore(subscriber, getUpdateReference);

  const mutatorCallback = useCallback<MutatorFunction<T>>(
    (mutator: Mutator<T>) => stateClient.set(key, mutator),
    [key, stateClient]
  );

  if (!stateClient.has(key)) {
    stateClient.initialize(key, initialValue);
  }

  return [stateClient.get(key) as T, mutatorCallback];
}

export function useMicroStateClient(): StateClient {
  const stateClient = useContext(StateContext);
  return stateClient;
}
