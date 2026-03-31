<h1 align="center"> ⚡️ <br />SuperState</h1>
<h3 align="center">
  Zero-boilerplate, No-Provider global state<br />for React 18 & 19
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/react-use-superstate" rel="noopener noreferrer nofollow" ><img src="https://img.shields.io/npm/v/react-use-superstate?color=0368FF&label=version" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/react-use-superstate" rel="noopener noreferrer nofollow" ><img src="https://img.shields.io/npm/dm/react-use-superstate?color=8D30FF&label=npm" alt="npm downloads per month"></a>
  <img alt="NPM License" src="https://img.shields.io/npm/l/react-use-superstate?color=FF2B6E">
</p>

SuperState is a tiny, zero-boilerplate state management library for React. It allows you to share global state across components with simple string keys—**no providers, no Context API, and no complex selectors.**

```bash
npm install react-use-superstate
```

## 🎯 Key Features

-   **Zero Boilerplate:** No store files, no `<Provider>` wrapping (except for optional SSR hydration).
-   **Fine-grained reactivity:** Built on `useSyncExternalStore`. Only components watching a specific key (or nested path) re-render.
-   **Deep Path Selectors:** Subscribe to nested objects or arrays using dot notation (`user.name`) or bracket notation (`users[0].id`).
-   **SSR Ready:** First-class support for Server-Side Rendering with hydration safety.
-   **Atomic Batching:** Group multiple updates into a single re-render cycle.
-   **TypeScript First:** Full type safety and intelligent inference.

## 🍦 Getting Started: The Owner/Consumer Pattern

SuperState follows a simple **Owner / Consumer** model. If you know `useState`, you already know SuperState.

### 1. The Owner (Declaration)
Use `createSuperState` to "own" and initialize a global piece of state.

```tsx
import { createSuperState } from "react-use-superstate"

function Navbar() {
    // This component "owns" the 'user' state. 
    // It works exactly like useState but registers it globally.
    const [user, setUser] = createSuperState('user', { name: 'Ahsan', age: 25 })
    
    return <h3>Welcome, {user.name}</h3>
}
```

### 2. The Consumer (Usage)
Use `useSuperState` to consume that state from **any other component** in your app.

```tsx
import { useSuperState } from "react-use-superstate"

function Profile() {
    // Access the 'user' state from anywhere!
    const [user, setUser] = useSuperState('user')
    
    return <button onClick={() => setUser(u => ({ ...u, age: u.age + 1 }))}>
      Age: {user.age}
    </button>
}
```

## 🚀 Advanced Usage

### Dot & Bracket Notation (Selectors)
Subscribe directly to nested properties. Your component will **only** re-render if that specific property changes.

```tsx
// Subscribe ONLY to the city property
const [city, setCity] = useSuperState('user.address.city')

// Subscribe to a specific array element
const [firstItem, setFirstItem] = useSuperState('cart[0]')
```

### Zero-Provider SSR Hydration
For SSR (Next.js, Remix), use `SuperStateProvider` to safely hydrate state from server to client and prevent data leaks between requests.

```tsx
// app/layout.tsx (Next.js Example)
import { SuperStateProvider } from 'react-use-superstate';

export default function RootLayout({ children }) {
  const serverData = { user: { name: 'Ahsan' } }; // Fetched on server

  return (
    <html>
      <body>
        <SuperStateProvider initialState={serverData}>
          {children}
        </SuperStateProvider>
      </body>
    </html>
  );
}
```

### Global Store Utilities
Manipulate state outside of React components (e.g., in API interceptors, WebSockets, or utility functions).

```tsx
import { getState, setState, batchUpdate, resetState } from "react-use-superstate"

// Get value synchronously
const user = getState('user')

// Functional updates
setState('user', (prev) => ({ ...prev, name: 'Talal' }))

// Atomic batching (triggers only 1 re-render)
batchUpdate(() => {
    setState('count', 10)
    setState('theme', 'dark')
})

// Reset to its owner's initial value
resetState('user')
```
## 👩🏻‍⚖️ License

MIT © [Sheikh Ahsan Talal](https://github.com/sh-ahsan)

