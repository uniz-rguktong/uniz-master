---
description: Critical UI framework gotchas and React anti-patterns for Agent reference
---

# UI Framework Gotchas & React Anti-Patterns

When touching React UI code, especially complex Modals or Framer Motion structures, you MUST adhere to the following principles. Failing to do so will result in catastrophic web page freezing that requires a hard refresh.

## 1. The Framer Motion Unmount Freeze
**The Problem**: Invoking `setState` inside a `useEffect` simultaneously while `framer-motion`'s `<AnimatePresence>` is handling the component's `exit` (unmount) transition corrupts the exit queue. This traps the component inside the DOM visually but not functionally, leading to background overlays (`fixed inset-0`) freezing the entire application against pointer events.

**The Solution**: 
When writing `useEffect` hooks in components wrapping `AnimatePresence` or modals receiving an `isOpen` or similar prop, **ALWAYS** short-circuit the execution if the modal is unmounting.

```tsx
// ❌ BAD
useEffect(() => {
  setFormData({...data}); 
}, [data, isOpen]);

// ✅ GOOD 
useEffect(() => {
  if (!isOpen) return; // Prevents state dispatch during exit animation
  setFormData({...data});
}, [data, isOpen]);
```

## 2. Event Bubbling in Animated Buttons
Verify that nested `motion.div` clicks or complex inline SVGs have properly structured `e.preventDefault()` handlers and stop propagation if they rest inside forms. Modals should distinctively separate `.onSubmit` forms and independent "discard" exit buttons.

## 3. Strict Hydration
Do not use `window.localStorage` inside component initialization without a `useEffect` protective wrapper or initial `null` state, as it will break Hydration bounds and destroy layout tracking IDs.
