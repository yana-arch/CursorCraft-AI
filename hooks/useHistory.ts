import { useState, useCallback } from 'react';

// Generic hook for state history
export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  // We use JSON serialization for deep cloning simple data structures like our Frames
  const deepClone = (obj: T): T => JSON.parse(JSON.stringify(obj));

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState((currentState) => {
      const computedNewState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(currentState) 
        : newState;
      
      // If no change, don't update history
      if (JSON.stringify(currentState) === JSON.stringify(computedNewState)) {
        return currentState;
      }

      setPast((prevPast) => {
        const newPast = [...prevPast, deepClone(currentState)];
        // Limit history size to 50 steps to save memory
        if (newPast.length > 50) newPast.shift();
        return newPast;
      });
      setFuture([]); // Clear future on new action
      
      return computedNewState;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const newPast = [...prevPast];
      const previousState = newPast.pop()!;

      setFuture((prevFuture) => [deepClone(state), ...prevFuture]);
      setState(previousState);

      return newPast;
    });
  }, [state]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const newFuture = [...prevFuture];
      const nextState = newFuture.shift()!;

      setPast((prevPast) => [...prevPast, deepClone(state)]);
      setState(nextState);

      return newFuture;
    });
  }, [state]);

  // Helper to force set state without adding to history (e.g. loading a project)
  const reset = useCallback((newState: T) => {
      setState(newState);
      setPast([]);
      setFuture([]);
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0
  };
}