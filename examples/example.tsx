import React from "react";
import { useMicroState, StateClient, StateClientProvider } from "../src/index";

const client = new StateClient();

/* 
  External subscription to a key.
  Keys can be externally set with .set (will trigger refresh)
  get with .get and checked for existence with .has 
*/

client.subscribe(["counter", 0], () =>
  console.log(client.has(["counter", 0]), client.get(["counter", 0]))
);

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

  const [counter, setCounter] = useMicroState(["counter", 0], 75);

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
