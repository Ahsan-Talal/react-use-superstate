<h1 align="center"> ⚡️ <br />SuperState</h1>
<h3 align="center">
  Zero-setup, key-based global state<br />for React
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/react-use-superstate" rel="noopener noreferrer nofollow" ><img src="https://img.shields.io/npm/v/react-use-superstate?color=0368FF&label=version" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/react-use-superstate" rel="noopener noreferrer nofollow" ><img src="https://img.shields.io/npm/dm/react-use-superstate?color=8D30FF&label=npm" alt="npm downloads per month"></a>
  <img alt="NPM License" src="https://img.shields.io/npm/l/react-use-superstate?color=FF2B6E">
</p>

```bash
npm install react-use-superstate
```

## Table of Contents

1. [Why SuperState?](#why-superstate)
2. [🍦 Getting Started](#-getting-started)
3. [🚀 Usage Patterns](#-usage-patterns)
4. [⚡️ Store Utilities](#-store-utilities)
5. [👩🏻‍⚖️ License](#-license)

## Why SuperState?

-   **Zero Boilerplate:** No store files, no `<Provider>` at the root, no complex selectors.
-   **Fine-grained reactivity:** Built on `useSyncExternalStore`. Only components watching a specific key (or sub-key) re-render.
-   **TypeScript-first:** Full type safety and intelligent inference out of the box.
-   **Production-ready:** Minimal footprint, persistent global state, and robust batching.

## 🍦 Getting Started

SuperState uses an **Owner / Consumer** pattern. If you know `useState`, you already know SuperState.

### React

```jsx
import { createSuperState, useSuperState } from "react-use-superstate"

// 1. Define and own the state
function Navbar() {
    const [user] = createSuperState('user', { name: 'Ahsan', age: 25 })
    return <h3>Welcome, {user.name}</h3>
}

// 2. Consume from anywhere else
function Profile() {
    const [age, setAge] = useSuperState('user.age')
    return <button onClick={() => setAge(a => a + 1)}>Age: {age}</button>
}
```

## 🚀 Usage Patterns

### Global vs Local
Promote any local `useState` to a global one just by adding a string key! Remove the key to make it local again.

```javascript
// Global: Shared across every component with 'theme' key
const [theme, setTheme] = createSuperState('theme', 'light')

// Local: Works exactly like React's useState
const [count, setCount] = createSuperState(0)
```

### Dot-Notation Selectors
Subscribe directly to nested object properties. Your component will **only** re-render if that specific property changes.

```javascript
// Subscribes only to 'address.city'
const [city, setCity] = useSuperState('user.address.city')
```

## ⚡️ Store Utilities

Access and manipulate your global state outside of React components (e.g., in API headers or utility functions).

```javascript
import { getState, setState, batchUpdate, resetState } from "react-use-superstate"

// Sync access
const user = getState('user')

// Functional updates
setState('user', (prev) => ({ ...prev, name: 'Talal' }))

// Atomic batching
batchUpdate(() => {
    setState('count', 1)
    setState('theme', 'dark')
})

// Reset to initial owner value
resetState('user')
```

## 👩🏻‍⚖️ License

-   SuperState is MIT licensed.
-   Created by **Sheikh Ahsan Talal**.

