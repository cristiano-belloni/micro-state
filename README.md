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

```javascript
import {
  useMicroState,
  StateClient,
  StateClientProvider
} from "@hya/micro-state"

const client = new StateClient()

/* 
  External subscription to a key.
  Keys can be externally set with .set (will trigger refresh)
  get with .get and checked for existence with .has 
*/

client.subscribe("counter", () =>
  console.log(client.has("counter"), client.get("counter"))
)

/* 
  StateClientProvider will guarantee that every descendant using useMicroState will trigger on key change
  with no additional configuration.
*/
function App() {
  return (
    <StateClientProvider client={client}>
      <CounterApp />
    </StateClientProvider>
  )
}

function CounterApp() {
  /* 
    useMicroState can work at any level below a Provider
    keys can be either arrays or string, but beware: ["my", "key"] is equivalent to "my.key"
    Components are refreshed only when the keys specified with useMicroState change.
  */

  const [counter, setCounter] = useMicroState("counter", 75)

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
  )
}

export default App

```