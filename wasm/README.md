# Rust → WebAssembly bridge

This crate is a small Rust module compiled to WebAssembly for heavy computations.

## Build

From the `wasm` directory, build for the web target and emit the bindings into the app:

```bash
wasm-pack build --target web --out-dir ../src/wasm/pkg
```

This will generate `three_sim_wasm_bg.wasm` plus JS bindings consumed by the Vite app.

## Example API

`magnitudes(points: &[f32]) -> Vec<f32>` expects packed XYZ coordinates and returns vector lengths.
