This is the complete, enterprise-grade Software Design Document (SDD) for the Algorithm Visualizer. It reflects the final "Phase 5: Interpreted Proxy Engine" architecture, resolving all 40+ technical bottlenecks we identified regarding state management, LLM non-determinism, security, and UI performance.

---

# Software Design Document: LLM-Powered Algorithm Visualizer (AlgoVis)

## 1. Introduction

**1.1 Purpose**
AlgoVis is an interactive, web-based platform that transforms natural language prompts or study summaries into step-by-step, interactive algorithm visualizations.

**1.2 Architectural Philosophy**
The system treats the Large Language Model (LLM) strictly as a logic generator, not a visual renderer or state manager. The LLM writes plain, vanilla JavaScript. A secure, custom-built Abstract Syntax Tree (AST) Interpreter intercepts data mutations via ES6 Proxies and translates them into a deterministic stream of UI rendering events.

---

## 2. System Architecture Overview

The system operates across three decoupled layers:

1. **The Backend Orchestrator:** Handles prompt sanitization, LLM communication, and logic caching.
2. **The Hermetic Sandbox (Web Worker):** Parses LLM-generated code into an AST and executes it step-by-step, intercepting memory operations using Proxies.
3. **The Presentation Engine (React + Canvas):** Receives deterministic delta events and animates them on a high-performance WebGL/Canvas layer.

---

## 3. Core Components

### 3.1 Backend & LLM Orchestration

* **Prompt Manager:** Wraps the user input in a strict system prompt. It forces the LLM to output standard JavaScript algorithms without any UI, DOM, or `yield` logic.
* **Type-Signed Semantic Cache:** Caches generated logic to reduce LLM API costs. The cache key is a hash of `(Algorithmic Intent + Initial State Type Signature)`. Cached code is only served if the user's input data matches the structural signature of the cached algorithm.
* **Telemetry Validator:** Code is only admitted to the Semantic Cache after the client confirms it executed successfully (no AST crashes) for at least 10 steps.

### 3.2 The Hermetic Sandbox (Web Worker)

* **JS-Interpreter (AST Engine):** Instead of `eval()` or native Worker execution, code is executed via an AST interpreter (e.g., `JS-Interpreter`). This enables granular execution pausing, infinite loop prevention, and extraction of local variables.
* **ES6 Proxy Interceptors:** Vanilla data structures (Arrays, Maps) injected into the interpreter are wrapped in ES6 Proxies. When the LLM executes `arr[i] = pivot`, the Proxy traps the mutation and emits a `MUTATION` event.
* **Deterministic Environment:** The Sandbox overwrites `Math.random` with a seeded PRNG. `Date.now`, `setTimeout`, and micro-tasks (`Promise`) are mocked or stripped to guarantee that time-traveling execution is $100\%$ reproducible.

### 3.3 Frontend Presentation (React + Canvas)

* **Canvas Renderer (PixiJS / WebGL):** Bypasses React's Virtual DOM for rendering nodes, arrays, and edges to easily handle 1,000+ events per second.
* **Deterministic Layout Engine:** Calculates spatial layouts for Trees/Graphs statically before the first frame, avoiding the non-deterministic "jiggle" of force-directed physics.
* **Playback Scheduler:** Manages the Event Queue. It supports dynamic tweening (CSS/Canvas animations) at $1\times$ speed, and instant frame-skipping at $10\times$ speed.

---

## 4. Data Flow & Execution Lifecycle

1. **User Input:** User requests "Visualize QuickSort on `[5, 2, 9, 1]`".
2. **LLM Generation:** The LLM returns pure JS logic: `function sort(arr) { ... }`.
3. **Sandbox Initialization:** The React main thread spawns a Web Worker. The Worker initializes the AST Interpreter and injects the proxied initial state (`[5, 2, 9, 1]`).
4. **AST Execution Loop:** The Interpreter executes the AST in chunks (e.g., 100 nodes per tick).
5. **Event Emission:** Every trapped Proxy mutation emits an `ActionPayload` to the main thread via `postMessage`.
6. **State Accumulation:** The main thread uses `Immer.js` to apply the incoming deltas to a base state, updating the UI.
7. **Keyframing:** Every 50 steps, the worker serializes a full `Keyframe` snapshot to IndexedDB.

---

## 5. Data Models & Schemas

### 5.1 The Event Payload (DSL)

All messages sent from the Worker Proxy to the React Main Thread follow a strict interface.

```typescript
type ActionType = 'READ' | 'MUTATION' | 'METHOD_CALL' | 'COMPARE';

interface ActionPayload {
  stepId: number;         // AST Execution tick count
  targetId: string;       // ID of the data structure (e.g., 'main_array')
  action: ActionType;
  metadata: {
    index?: number;
    indices?: number[];   // For swaps/comparisons
    oldValue?: any;
    newValue?: any;
    methodName?: string;
  };
  localScope: Record<string, any>; // Extracted from AST (e.g., { i: 0, pivot: 5 })
  lineNumber: number;     // Extracted from AST for code highlighting
}

```

### 5.2 The Time-Travel State Store

To support $O(1)$ reverse stepping without RAM bloat:

```typescript
interface PlaybackState {
  activeDeltas: ActionPayload[]; // Stored in React Memory (Max 50 items)
  keyframes: Map<number, any>;   // Stored in IndexedDB (Every 50 steps)
  currentStepIndex: number;
}

```

---

## 6. Security & Error Handling

* **Infinite Loop Prevention:** The AST Interpreter has a hardcoded operation limit. If the LLM generates `while(true)`, the interpreter simply pauses execution and returns an `EXECUTION_HALTED` event to the UI without crashing the Worker thread.
* **Code Injection Protection:** The Web Worker has zero access to the DOM (`window`, `document`) and uses a strict Content Security Policy (CSP).
* **Sanitized Error Boundaries:** If the LLM writes invalid syntax, the interpreter throws an error. The stack trace is sanitized to remove backend/sandbox details before displaying the specific syntax error in the UI's code editor.

---

## 7. Edge Cases & Mitigations

| Risk | Mitigation Strategy |
| --- | --- |
| **LLM uses raw `arr[0] = 1` instead of SDK methods** | The ES6 Proxy intercepts native index assignment. No SDK needed. |
| **User rapidly clicks "Step Back" 500 times** | UI fetches the nearest $n-50$ Keyframe from IndexedDB and instantly applies Immer patches up to the requested frame. |
| **LLM hallucinates external libraries** | The AST interpreter only recognizes injected primitives. It will throw an immediate `ReferenceError`, prompting the user to edit the code. |
| **Main Thread DOM Bottleneck** | Render operations target a Canvas/WebGL context. React only handles the play/pause controls and code editor. |
| **Lost local variables during execution** | The AST Interpreter extracts the current stack frame variables on every yield, appending `localScope` to the UI payload. |
