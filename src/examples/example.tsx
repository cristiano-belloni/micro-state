import React, { useCallback } from "react";
import { useMicroState, StateClient, StateClientProvider } from "../index";

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
      <AsyncCounterApp />
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
  const incrementCounter = useCallback(
    () => setCounter((counter) => (counter += 1)),
    [setCounter]
  );
  const decrementCounter = useCallback(
    () => setCounter((counter) => (counter -= 1)),
    [setCounter]
  );
  const resetCounter = useCallback(() => setCounter(0), [setCounter]);

  /*
    setter functions accept reducer functions or values, exactly like React's setState. 
  */
  return (
    <pre>
      <p>
        Counter: <strong>{counter}</strong>
      </p>
      <button onClick={decrementCounter}>- 1</button>
      <button onClick={incrementCounter}>+ 1</button>
      <button onClick={resetCounter}>Reset</button>
    </pre>
  );
}

function AsyncCounterApp() {
  /* 
    useMicroState can work at any level below a Provider
    keys can be either arrays or string, but beware: ["my", "key"] is equivalent to "my.key"
    Components are refreshed only when the keys specified with useMicroState change.
  */

  const [counter, setCounter] = useMicroState(["counter", 0], 88);

  const incrementCounterLater = useCallback(
    () => setTimeout(() => setCounter((counter) => (counter += 10)), 1000),
    [setCounter]
  );
  const decrementCounterLater = useCallback(
    () => setTimeout(() => setCounter((counter) => (counter -= 10)), 1000),
    [setCounter]
  );
  const resetCounter = useCallback(() => setCounter(0), [setCounter]);

  /*
    setter functions accept reducer functions or values, exactly like React's setState. 
  */
  return (
    <pre>
      <p>
        Counter: <strong>{counter}</strong>
      </p>
      <button onClick={decrementCounterLater}>- 10 in one sec</button>
      <button onClick={incrementCounterLater}>+ 10 in one sec</button>
      <button onClick={resetCounter}>Reset</button>
    </pre>
  );
}

export default App;
