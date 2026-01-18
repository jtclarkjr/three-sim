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
/// Config format: [storeWidth, storeHeight, rowCount, rowSpacing, rowThickness, startOffset, walkwayWidth, crossRowBuffer, outerWalkwayOffset, orientation]
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
    let transformed_products = if matches!(store_config.orientation, Orientation::Horizontal) {
        let mut out = Vec::with_capacity(products.len());
        for chunk in products.chunks_exact(2) {
            let (x, y) = store_config.transform_coords(chunk[0], chunk[1]);
            out.push(x);
            out.push(y);
        }
        Some(out)
    } else {
        None
    };
    let products_ref = transformed_products
        .as_deref()
        .unwrap_or(products);

    for chunk in robots.chunks_exact(7) {
        let (x, y) = store_config.transform_coords(chunk[0], chunk[1]);
        let (dest_x, dest_y) = store_config.transform_coords(chunk[2], chunk[3]);
        let orientation = store_config.transform_orientation(chunk[4]);
        let result = update_single_robot(
            x,
            y,
            dest_x,
            dest_y,
            orientation,
            chunk[5],
            chunk[6],
            products_ref,
            &store_config, delta,
        );
        let (out_x, out_y) = store_config.transform_coords(result[0], result[1]);
        let (out_dest_x, out_dest_y) = store_config.transform_coords(result[2], result[3]);
        let out_orientation = store_config.transform_orientation(result[4]);
        output.extend_from_slice(&[
            out_x,
            out_y,
            out_dest_x,
            out_dest_y,
            out_orientation,
            result[5],
            result[6],
        ]);
    }

    output
}

/// Compute a path from start to end, optionally preferring outer walkways
/// Config format: [storeWidth, storeHeight, rowCount, rowSpacing, rowThickness, startOffset, walkwayWidth, crossRowBuffer, outerWalkwayOffset, orientation]
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

    let start_pt = store_config.transform_coords(start[0], start[1]);
    let end_pt = store_config.transform_coords(end[0], end[1]);

    let path = if prefer_outer_walkway {
        compute_path_with_outer_walkway(start_pt, end_pt, &store_config)
    } else {
        find_path(start_pt, end_pt, &store_config)
    };

    let mut finalized = path;
    if let Some(last) = finalized.last() {
        let dx = last.0 - end_pt.0;
        let dy = last.1 - end_pt.1;
        if dx * dx + dy * dy > 0.25 {
            finalized.push(end_pt);
        }
    } else {
        finalized.push(end_pt);
    }

    finalized
        .into_iter()
        .flat_map(|(x, y)| {
            let (tx, ty) = store_config.transform_coords(x, y);
            vec![tx, ty]
        })
        .collect()
}

/// Move a single robot towards a target waypoint
/// Input: [x, y, destX, destY, orientation, speed, lastMoveTime, waypointX, waypointY, deltaMs]
/// Config format: [storeWidth, storeHeight, rowCount, rowSpacing, rowThickness, startOffset, walkwayWidth, crossRowBuffer, outerWalkwayOffset, orientation]
/// Output: [newX, newY, orientation]
#[wasm_bindgen]
pub fn move_robot_to_waypoint(robot_data: &[f32], config: &[f32]) -> Vec<f32> {
    if robot_data.len() < 10 {
        return Vec::new();
    }

    let store_config = StoreConfig::from_buffer(config);
    let (x, y) = store_config.transform_coords(robot_data[0], robot_data[1]);
    let orientation = store_config.transform_orientation(robot_data[4]);
    let (waypoint_x, waypoint_y) =
        store_config.transform_coords(robot_data[7], robot_data[8]);
    let result = move_to_waypoint(
        x,
        y,
        orientation,
        robot_data[5],
        waypoint_x,
        waypoint_y,
        robot_data[9],
    );

    let (out_x, out_y) = store_config.transform_coords(result[0], result[1]);
    let out_orientation = store_config.transform_orientation(result[2]);
    vec![out_x, out_y, out_orientation]
}

/// Move a single robot towards a target waypoint with product collision checks
/// Input: [x, y, destX, destY, orientation, speed, lastMoveTime, waypointX, waypointY, deltaMs]
/// Config format: [storeWidth, storeHeight, rowCount, rowSpacing, rowThickness, startOffset, walkwayWidth, crossRowBuffer, outerWalkwayOffset, orientation]
/// Output: [newX, newY, orientation]
#[wasm_bindgen]
pub fn move_robot_to_waypoint_with_products(
    robot_data: &[f32],
    products: &[f32],
    config: &[f32],
) -> Vec<f32> {
    if robot_data.len() < 10 {
        return Vec::new();
    }

    let store_config = StoreConfig::from_buffer(config);
    let (x, y) = store_config.transform_coords(robot_data[0], robot_data[1]);
    let orientation = store_config.transform_orientation(robot_data[4]);
    let (waypoint_x, waypoint_y) =
        store_config.transform_coords(robot_data[7], robot_data[8]);
    let transformed_products = if matches!(store_config.orientation, Orientation::Horizontal) {
        let mut out = Vec::with_capacity(products.len());
        for chunk in products.chunks_exact(2) {
            let (px, py) = store_config.transform_coords(chunk[0], chunk[1]);
            out.push(px);
            out.push(py);
        }
        Some(out)
    } else {
        None
    };
    let products_ref = transformed_products.as_deref().unwrap_or(products);

    let result = move_to_waypoint_with_collision(
        x,
        y,
        orientation,
        robot_data[5],
        waypoint_x,
        waypoint_y,
        robot_data[9],
        products_ref,
        &store_config,
    );

    let (out_x, out_y) = store_config.transform_coords(result[0], result[1]);
    let out_orientation = store_config.transform_orientation(result[2]);
    vec![out_x, out_y, out_orientation]
}

/// Check if a robot has arrived at its waypoint
/// Input: [robotX, robotY, waypointX, waypointY]
/// Config format: [storeWidth, storeHeight, rowCount, rowSpacing, rowThickness, startOffset, walkwayWidth, crossRowBuffer, outerWalkwayOffset, orientation]
/// Output: 1.0 if arrived, 0.0 if not
#[wasm_bindgen]
pub fn has_arrived_at_waypoint(positions: &[f32], config: &[f32]) -> f32 {
    if positions.len() < 4 {
        return 0.0;
    }

    let store_config = StoreConfig::from_buffer(config);
    let (robot_x, robot_y) = store_config.transform_coords(positions[0], positions[1]);
    let (waypoint_x, waypoint_y) = store_config.transform_coords(positions[2], positions[3]);

    if check_arrival(robot_x, robot_y, waypoint_x, waypoint_y) {
        1.0
    } else {
        0.0
    }
}
