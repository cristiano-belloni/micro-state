# micro-state

## What

A really (856 byte gzipped) tiny state manager for React with hooks.
Key-value based, global and performant (only refreshes a component if needed).

## Why

I needed a simple state manager to use standalone or as a synchronous companion to [react-query](https://react-query.tanstack.com/), that had the following characteristics:

- Small, no dependencies
- Global state (no prop drilling) without Connect, HOCs or boilerplate
- Tiny, hook-based API surface
- State can be modified or listened to from outside React, seamlessly
- Efficient: only triggers a refresh to a component if needed

### Why not `useReduce` + React Context?

Because [when context dispatches, it re-renders all the components that are subscribed to it](https://blog.isquaredsoftware.com/2021/01/context-redux-differences/#context-and-usereducer). Also, it's not easy to access the store from outside React, which in some cases might be a problem - for example, when synchronising state externally between two different instances of the same web app.

## How

### To install

`npm i --save @hya/micro-state`

### To use

```jsx
import {
  useMicroState,
  StateClient,
  StateClientProvider,
} from "@hya/micro-state";

const client = new StateClient();

/* 
  External subscription to a key. This is completely optional.
  Keys can be externally set with .set (will trigger refresh)
  get with .get and checked for existence with .has 
*/

client.subscribe("counter", () =>
  console.log(client.has("counter"), client.get("counter"))
);

/* 
  StateClientProvider will guarantee that every descendant using useMicroState will trigger on key change
  with no additional configuration.
*/
function App() {
  return (
    <StateClientProvider client={client}>
      <CounterApp />
    </StateClientProvider>
  );
}

function CounterApp() {
  /* 
    useMicroState can work at any level below a Provider
    keys can be either arrays or string, but beware: ["my", "key"] is equivalent to "my.key"
    Components are refreshed only when the keys specified with useMicroState change.
  */

  const [counter, setCounter] = useMicroState("counter", 75);

  /*
    setter functions accept reducer functions or values, exactly like React's setState. 
  */
  return (
    <pre>
      <p>
        Counter: <strong>{counter}</strong>
      </p>
      <button onClick={() => setCounter((counter) => (counter -= 1))}>
        - 1
      </button>
      <button onClick={() => setCounter((counter) => (counter += 1))}>
        + 1
      </button>
      <button onClick={() => setCounter(0)}>Reset</button>
    </pre>
  );
}

export default App;
```

## Reference

### StateClient

`const stateClient = new new StateClient()`

When instantiated with `new`, creates an instance of a state client that can be used and/or passed to a `StateClientProvider`. This needs to be instantiated only once, typically **outside of the root React component**.

#### API

##### subscribe

`stateClient.subscribe(key: Key, callback: ObserverCallback)`

Subscribe to a `key` and call `callback` when the key is updated. Please note that the callback has no arguments and the key value won't be passed to the callback (use `get` to get it).

##### get

`<T,>stateClient.get(key: Key): T`

Get a `key` from the current state.

##### set

`stateClient.set(key: Key, mutator: Mutator)`

Set a `key` providing either a value or a mutator function (a function which takes the current value and returns the new value). This will trigger all the subscribers and refresh all the components using `useMicroState` for that key.

##### initialize

`stateClient.initialize(providedKey: Key, value: unknown)`

Set a `key` providing a value. This will **not** trigger any subscriber or refresh any component that uses `useMicroState` for that key.

##### has

`<T,>stateClient.has(key: Key): boolean`

Return `true` if `key` from the current state has been set or initialized once, `false` otherwise. This is useful
because `get` will return `undefined` either for a key explicitly set to `undefined` or a key that was never set / initialized.

### StateClientProvider

`StateClientProvider({ client, children }: StateClientParams)`

This is a [React Context Provider](https://reactjs.org/docs/context.html#contextprovider) that will allow the usage of `useMicroState` and `useMicroStateClient` in all its descendents. Gets passed a `StateClient`. Use it like this:

```jsx
const client = new StateClient();

function MyApp() {
  return (
    <StateClientProvider client={client}>
      {/* All these children and their descendents will be able to use the hook methods */}
    </StateClientProvider>
  );
}
```

### useMicroState

`function useMicroState<T>(key: Key, initialValue: T): [T, MutatorFunction<T>]`

Get a tuple containing the immediate value of the key `key` and a setter function that imperatively modifies the key
like the `stateClient.set` method. If the value associated with the key is set, the component will refresh. This is typically the hook you want to use inside your react components.

Please note that:

- `key` can be a string or an array of strings | numbers. If it's an array, it will be internally serialized to a dot-separated string, so `["my", "array"]` will be the same key as `"my.array"`.

- The mutator function can either take a new value or a reducer function with the old value as only argument. In this last case, the returned value will be the new value, similarly to [React's useState functional updates](https://reactjs.org/docs/hooks-reference.html#functional-updates).

### useMicroStateClient

`function useMicroStateClient(): StateClient`

A hook that returns the `StateClient` passed to the parent `StateClientProvider`. Useful to subscribe / unsubscribe to a key in a hook without refreshing the component (for example if we're using the key to update a canvas reference that's handled outside the React cycle and does its own repainting).
