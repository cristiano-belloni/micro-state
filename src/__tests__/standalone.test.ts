import { createMicroState, MicroState } from "../index";

describe("standalone microstate", () => {
  let microState: MicroState;
  beforeEach(() => {
    microState = createMicroState();
  });
  it("should create a microstate", () => {
    expect(microState).toBeDefined();
  });
  it("should set a value", () => {
    microState.set("foo", "bar");
    expect(microState.get("foo")).toBe("bar");
  });
  it("should set a value using a mutator", () => {
    microState.set("foo", "bar");
    microState.set("foo", (value: string) => value + "baz");
    expect(microState.get("foo")).toBe("barbaz");
  });
  it("should set a value using a mutator and call subscribers", () => {
    const callback = jest.fn();
    microState.subscribe("foo", callback);
    microState.set("foo", (value: string) => value + "baz");
    expect(callback).toHaveBeenCalled();
  });
  it("should set a value using a mutator and do not call subscribers after unsubscribing", () => {
    const callback = jest.fn();
    microState.subscribe("foo", callback);
    microState.set("foo", (value: string) => value + "baz");
    microState.unsubscribe("foo", callback);
    microState.set("foo", (value: string) => value + "bar");
    microState.set("foo", "bee");
    expect(callback).toHaveBeenCalledTimes(1);
  });
  it("should initialise a value without calling subscribers", () => {
    const callback = jest.fn();
    microState.subscribe("foo", callback);
    microState.initialize("foo", "bar");
    expect(callback).not.toHaveBeenCalled();
    expect(microState.get("foo")).toBe("bar");
  });
  it("should return true or false to has depending if the value has been set", () => {
    expect(microState.has("foo")).toBe(false);
    microState.initialize("foo", undefined);
    expect(microState.has("foo")).toBe(true);
    expect(microState.get("foo")).toBe(undefined);
  });
});
