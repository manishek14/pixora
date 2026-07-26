'use client';

// Tiny toast store — no provider required, just call `toast.error(msg)`.
// The <Toaster /> component (rendered once in the root layout) subscribes
// to this store and renders the stack.

import { useSyncExternalStore } from 'react';

export type ToastVariant = 'error' | 'success' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  // auto-dismiss timeout in ms (0 = sticky)
  duration: number;
}

type Listener = () => void;

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  error: 6000,
  success: 3500,
  info: 3500,
  warning: 4500,
};

let items: ToastItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return items;
}

function push(variant: ToastVariant, message: string, duration?: number) {
  const id = nextId++;
  const dur = duration ?? DEFAULT_DURATION[variant];
  items = [...items, { id, variant, message, duration: dur }];
  emit();

  if (dur > 0) {
    if (typeof window !== 'undefined') {
      setTimeout(() => dismiss(id), dur);
    }
  }
  return id;
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  error: (msg: string, dur?: number) => push('error', msg, dur),
  success: (msg: string, dur?: number) => push('success', msg, dur),
  info: (msg: string, dur?: number) => push('info', msg, dur),
  warning: (msg: string, dur?: number) => push('warning', msg, dur),
  dismiss,
};

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
