/**
 * React Singleton Guard
 * 
 * Prevents duplicate React instance crashes caused by Vite's pre-bundling
 * creating separate React copies. This module MUST be the first import in main.tsx.
 * 
 * Strategy: Detect if a secondary React instance exists and patch its hooks
 * to delegate to the canonical (first-loaded) instance.
 */
import React from 'react';

const GLOBAL_KEY = '__REACT_SINGLETON__';

if (!(window as any)[GLOBAL_KEY]) {
  // First load — register the canonical React instance
  (window as any)[GLOBAL_KEY] = React;
} else {
  // A React instance already exists — patch this one to use the canonical hooks
  const canonical = (window as any)[GLOBAL_KEY];
  const hookNames = [
    'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback',
    'useMemo', 'useRef', 'useLayoutEffect', 'useImperativeHandle',
    'useDebugValue', 'useDeferredValue', 'useTransition', 'useId',
    'useSyncExternalStore', 'useInsertionEffect',
  ] as const;

  for (const hook of hookNames) {
    if (canonical[hook] && typeof canonical[hook] === 'function') {
      (React as any)[hook] = canonical[hook];
    }
  }
}

export default React;
