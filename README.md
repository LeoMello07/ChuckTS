# ChuckTS ⚡

> An embedded HTTP traffic inspector for React Native — like a mini Charles Proxy living inside your app.

Inspired by [Chucker](https://github.com/ChuckerTeam/chucker) for Android and [React Query Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools), ChuckTS lets you intercept, inspect, and debug every HTTP request your app makes — without leaving the simulator or device.

---

## Features

- 🔌 **Intercepts `fetch` and `axios`** automatically
- 📋 **Captures** URL, method, headers, request/response body, status code, duration, size, errors, timeouts, and aborts
- 🎨 **Beautiful dark UI** with syntax-highlighted JSON viewer
- 🔍 **Search & filter** by URL, HTTP method, and status code group
- 📎 **Copy payload** or generate a **cURL** command in one tap
- 📤 **Share / export** logs as JSON; import them back later
- 📌 **Draggable floating button** with live badge counter
- 🔒 **Dev-only by default** — zero overhead in production
- ⚙️ **Configurable**: max requests, payload truncation, persistence

---

## Installation

```bash
npm install chuckts
# or
yarn add chuckts
```

### Peer dependencies

```bash
# Required
npm install react react-native zustand

# Optional (only if you use axios)
npm install axios

# For clipboard support
npm install @react-native-clipboard/clipboard
```

---

## Quick start

### 1. Initialise at app startup

```ts
// index.js or App.tsx — as early as possible
import { ChuckTS } from 'chuckts';

ChuckTS.start();
```

### 2. Attach interceptors

```ts
// Intercept the global fetch
ChuckTS.attachFetch();

// Intercept an Axios instance
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });
ChuckTS.attachAxios(api);
```

### 3. Mount the Devtools

```tsx
import { Devtools } from 'chuckts';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* your app */}
      <Devtools showFloatingButton />
    </SafeAreaView>
  );
}
```

Tap the **🔌** floating button (or call `ChuckTS.open()`) to open the inspector.

---

## API Reference

### `ChuckTS.start(config?)`

Initialises ChuckTS. Must be called before `attachFetch` / `attachAxios`.

| Option | Type | Default | Description |
|---|---|---|---|
| `maxRequests` | `number` | `200` | Max requests kept in memory |
| `enableInProduction` | `boolean` | `false` | Allow running outside `__DEV__` |
| `maxPayloadSize` | `number` | `32768` | Bytes before truncation (32 KB) |
| `persist` | `boolean` | `false` | _(reserved)_ Persist via AsyncStorage |

```ts
ChuckTS.start({
  maxRequests: 500,
  maxPayloadSize: 64 * 1024,
});
```

### `ChuckTS.attachFetch()`

Patches the global `fetch` function. Call once.

### `ChuckTS.attachAxios(instance)`

Attaches request/response interceptors to an Axios instance. Safe to call with multiple instances.

### `ChuckTS.detachFetch()` / `ChuckTS.detachAxios(instance)`

Removes interceptors without stopping ChuckTS.

### `ChuckTS.stop()`

Removes all interceptors and resets state.

### `ChuckTS.open()` / `ChuckTS.close()` / `ChuckTS.toggle()`

Programmatically control the inspector panel.

### `ChuckTS.clear()`

Clears all stored requests.

### `ChuckTS.exportLogs(): string`

Returns all records as a JSON string. Useful for CI logging or bug reports.

```ts
const logs = ChuckTS.exportLogs();
await Share.share({ message: logs });
```

### `ChuckTS.importLogs(json: string)`

Imports previously exported logs into the store.

---

## Components

### `<Devtools showFloatingButton? />`

All-in-one component. Renders the inspector modal and (optionally) the draggable floating trigger button.

### `<FloatingButton />`

Standalone draggable button. Tap to open/close. Shows a badge with request count; turns red on errors.

### `<JsonViewer value={string | null} maxInitialDepth? />`

Collapsible, syntax-highlighted JSON tree viewer.

### `<RequestList />`

The full filterable request list. Embeddable in your own UI.

### `<RequestDetails record={HttpRecord} onClose={() => void} />`

Detail view for a single request. Shows Request / Response / Raw (cURL) tabs.

---

## Store

The store is a Zustand instance exported as `useChuckTSStore`. You can read and subscribe to it directly:

```ts
import { useChuckTSStore } from 'chuckts';

const count = useChuckTSStore((s) => s.records.length);
```

---

## Utilities

### `generateCurl(record: HttpRecord): string`

Generates a cURL command from any `HttpRecord`.

### `getFilteredRecords(records, filter): HttpRecord[]`

Pure filter function used internally by `RequestList`.

---

## Architecture

```
src/
├── core/
│   ├── interceptor.ts        # Context bridge between interceptors and store
│   ├── fetchInterceptor.ts   # Global fetch patch
│   ├── axiosInterceptor.ts   # Axios request/response interceptors
│   ├── serializer.ts         # Safe serialisation, truncation, header parsing
│   ├── curlGenerator.ts      # cURL command generator
│   └── ChuckTS.ts            # Public API class (singleton)
├── store/
│   └── index.ts              # Zustand store + getFilteredRecords
├── types/
│   └── index.ts              # Shared TypeScript types
├── ui/
│   ├── theme.ts              # Design tokens
│   ├── Devtools.tsx          # Modal shell
│   ├── RequestList.tsx       # Filterable list
│   ├── RequestDetails.tsx    # Detail view (Request/Response/Raw tabs)
│   ├── JsonViewer.tsx        # Collapsible JSON tree
│   └── FloatingButton.tsx    # Draggable trigger
└── index.ts                  # Public exports
```

---

## Running tests

```bash
npm test
# or with coverage
npm run test:coverage
```

---

## Example app

See [`example/App.tsx`](./example/App.tsx) for a runnable demo that fires `fetch`, `axios`, a 404, and an aborted request.

---

## Contributing

PRs and issues are welcome! Please open an issue first for significant changes.

---

## License

MIT © [LeoMello07](https://github.com/LeoMello07)
