mod constants;
mod geometry;
mod grid;
mod pathfinding;
mod robot;

use constants::*;
use pathfinding::*;
use robot::*;
use wasm_bindgen::prelude::*;

/// Compute vector magnitudes for packed XYZ positions (x1, y1, z1, x2, y2, z2, ...)
/// This is a simple demo of the Rust→Wasm bridge for heavier math.
#[wasm_bindgen]
pub fn magnitudes(points: &[f32]) -> Vec<f32> {
    if points.is_empty() || !points.len().is_multiple_of(3) {
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
    if a.len() != b.len() || a.is_empty() || !a.len().is_multiple_of(3) {
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
    if a.len() != b.len() || a.is_empty() || !a.len().is_multiple_of(3) {
        return Vec::new();
    }

    let clamped_t = t.clamp(0.0, 1.0);
    a.iter()
        .zip(b.iter())
        .map(|(av, bv)| av * (1.0 - clamped_t) + bv * clamped_t)
        .collect()
}

/// Update multiple robots in parallel
/// Input format per robot: [x, y, destX, destY, orientation, speed, lastMoveTime]
/// Config format: [storeWidth, storeHeight, aisleCount, aisleSpacing, aisleWidth, startOffset, walkwayWidth, crossAisleBuffer, outerWalkwayOffset, orientation]
#[wasm_bindgen]
pub fn update_robots(robots: &[f32], products: &[f32], config: &[f32], delta_ms: f32) -> Vec<f32> {
    if !robots.len().is_multiple_of(7) {
        return Vec::new();
    }

    let store_config = StoreConfig::from_buffer(config);
    let delta = if delta_ms > 0.0 {
        delta_ms
    } else {
        UPDATE_INTERVAL_DEFAULT
    };
    let mut output: Vec<f32> = Vec::with_capacity(robots.len());

    for chunk in robots.chunks_exact(7) {
        let result = update_single_robot(
            chunk[0], chunk[1], chunk[2], chunk[3], chunk[4], chunk[5], chunk[6], products,
            &store_config, delta,
        );
        output.extend_from_slice(&result);
    }

    output
}

/// Compute a path from start to end, optionally preferring outer walkways
/// Config format: [storeWidth, storeHeight, aisleCount, aisleSpacing, aisleWidth, startOffset, walkwayWidth, crossAisleBuffer, outerWalkwayOffset, orientation]
#[wasm_bindgen]
pub fn compute_path(
    start: &[f32],
    end: &[f32],
    config: &[f32],
    prefer_outer_walkway: bool,
) -> Vec<f32> {
    if start.len() < 2 || end.len() < 2 {
        return Vec::new();
    }
    let store_config = StoreConfig::from_buffer(config);

    let start_pt = (start[0], start[1]);
    let end_pt = (end[0], end[1]);

    let path = if prefer_outer_walkway {
        compute_path_with_outer_walkway(start_pt, end_pt, &store_config)
    } else {
        find_path(start_pt, end_pt, &store_config)
    };

    path.into_iter().flat_map(|(x, y)| vec![x, y]).collect()
}

/// Move a single robot towards a target waypoint
/// Input: [x, y, destX, destY, orientation, speed, lastMoveTime, waypointX, waypointY, deltaMs]
/// Output: [newX, newY, orientation]
#[wasm_bindgen]
pub fn move_robot_to_waypoint(robot_data: &[f32]) -> Vec<f32> {
    if robot_data.len() < 10 {
        return Vec::new();
    }

    let result = move_to_waypoint(
        robot_data[0],
        robot_data[1],
        robot_data[4],
        robot_data[5],
        robot_data[7],
        robot_data[8],
        robot_data[9],
    );

    vec![result[0], result[1], result[2]]
}

/// Check if a robot has arrived at its waypoint
/// Input: [robotX, robotY, waypointX, waypointY]
/// Output: 1.0 if arrived, 0.0 if not
#[wasm_bindgen]
pub fn has_arrived_at_waypoint(positions: &[f32]) -> f32 {
    if positions.len() < 4 {
        return 0.0;
    }

    if check_arrival(positions[0], positions[1], positions[2], positions[3]) {
        1.0
    } else {
        0.0
    }
}
