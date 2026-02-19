/**
 * React Proxy Entry — forces react + react-dom into ONE esbuild pre-bundle chunk.
 *
 * When Vite pre-bundles dependencies, esbuild can split react and react-dom
 * into separate output chunks if they're processed in different passes.
 * By importing BOTH from this single proxy file, esbuild is forced to process
 * them together in a single invocation, guaranteeing they share the same
 * ReactCurrentDispatcher object reference.
 *
 * This file is referenced by the vite.config.ts optimizeDeps.entries option
 * so esbuild always starts from here.
 */
import React from 'react';
import ReactDOM from 'react-dom';
export { React, ReactDOM };
