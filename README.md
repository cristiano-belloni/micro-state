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
