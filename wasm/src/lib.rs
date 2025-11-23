use wasm_bindgen::prelude::*;

/// Compute vector magnitudes for packed XYZ positions (x1, y1, z1, x2, y2, z2, ...)
/// This is a simple demo of the Rust→Wasm bridge for heavier math.
#[wasm_bindgen]
pub fn magnitudes(points: &[f32]) -> Vec<f32> {
    if points.is_empty() || points.len() % 3 != 0 {
        return Vec::new();
    }

    points
        .chunks(3)
        .map(|c| {
            let (x, y, z) = (c[0], c[1], c[2]);
            (x * x + y * y + z * z).sqrt()
        })
        .collect()
}

/// Compute per-vector dot products for two packed XYZ buffers of equal length.
#[wasm_bindgen]
pub fn dot_products(a: &[f32], b: &[f32]) -> Vec<f32> {
    if a.len() != b.len() || a.is_empty() || a.len() % 3 != 0 {
        return Vec::new();
    }

    a.chunks(3)
        .zip(b.chunks(3))
        .map(|(a_vec, b_vec)| a_vec[0] * b_vec[0] + a_vec[1] * b_vec[1] + a_vec[2] * b_vec[2])
        .collect()
}

/// Linearly interpolate two packed XYZ buffers: result = a * (1 - t) + b * t.
#[wasm_bindgen]
pub fn lerp_vectors(a: &[f32], b: &[f32], t: f32) -> Vec<f32> {
    if a.len() != b.len() || a.is_empty() || a.len() % 3 != 0 {
        return Vec::new();
    }

    let clamped_t = t.clamp(0.0, 1.0);
    a.iter()
        .zip(b.iter())
        .map(|(av, bv)| av * (1.0 - clamped_t) + bv * clamped_t)
        .collect()
}
