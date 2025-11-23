# Three React

A Three.js demo application built with React, showcasing interactive 3D
geometries with a modern UI.

## Overview

This project demonstrates the integration of Three.js with React using
`@react-three/fiber`, featuring animated 3D shapes including cubes, spheres,
toruses, and cones. Users can dynamically switch between different geometries
through an interactive UI.

The application also includes a robot 3D map page that visualizes robot
positions and movements in a 3D store environment.

## Tech Stack

- **React 19** - UI framework
- **Three.js** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **TanStack Router** - Type-safe routing
- **TanStack Start** - Full-stack React framework
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Biome** - Linting and formatting
- **Vitest** - Testing

## Getting Started

### Installation

```bash
bun install
```

### Development

Run the development server:

```bash
bun dev
```

The application will be available at `http://localhost:3000`.

### Build

Build for production:

```bash
bun build
```

### Preview

Preview the production build:

```bash
bun serve
```

## Rust + WebAssembly compute

Heavy computations can run in Rust and be consumed in React via WebAssembly.

### Build the Wasm module

From `wasm/`:

```bash
cargo install wasm-pack # once, if not installed
cd wasm && wasm-pack build --target web --out-dir ../src/wasm/pkg
```

This generates `three_sim_wasm_bg.wasm` plus JS/TS bindings in `src/wasm/pkg`, replacing the stub files.

### Use in React

Load the module with the provided hook:

```ts
import { useWasmCompute } from '@/hooks/useWasmCompute'

const { ready, computeMagnitudes, computeDotProducts, computeLerpVectors } =
  useWasmCompute()
// wait for ready before calling
```

APIs:
- `computeMagnitudes(buffer)` — lengths of packed XYZ vectors.
- `computeDotProducts(a, b)` — per-vector dot product for two packed XYZ buffers.
- `computeLerpVectors(a, b, t)` — linear interpolation of two packed XYZ buffers.

Notes:
- If the generated Wasm module is missing, the app falls back to the JS stub in `src/wasm/pkg`, so UI stays up; rebuild with `wasm-pack` to restore Rust implementations.
- Expose new Rust functions with `#[wasm_bindgen]` and rebuild with `wasm-pack`.

## License

MIT
