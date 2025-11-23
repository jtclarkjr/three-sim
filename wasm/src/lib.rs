use js_sys::Math;
use wasm_bindgen::prelude::*;

const UPDATE_INTERVAL_DEFAULT: f32 = 50.0;
const STUCK_TIMEOUT: f32 = 3000.0;
const ROBOT_RADIUS: f32 = 2.0;
const PRODUCT_RADIUS: f32 = 0.5;
const COLLISION_BUFFER: f32 = 0.5;
const NUM_AISLES: i32 = 6;
const AISLE_SPACING: f32 = 30.0;
const AISLE_WIDTH: f32 = 6.0;
const WALKWAY_WIDTH: f32 = 10.0;
const TOP_BOTTOM_OFFSET: f32 = 10.0;

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

fn random_f32() -> f32 {
    Math::random() as f32
}

fn clamp(value: f32, min: f32, max: f32) -> f32 {
    value.max(min).min(max)
}

fn is_in_aisle_walkway(x: f32, y: f32, width: f32, height: f32) -> bool {
    let top_walkway_y = height / 2.0 - TOP_BOTTOM_OFFSET;
    let bottom_walkway_y = -height / 2.0 + TOP_BOTTOM_OFFSET;

    for aisle in 0..(NUM_AISLES - 1) {
        let aisle_x = -width / 2.0 + 20.0 + (aisle as f32) * AISLE_SPACING;
        let next_aisle_x = -width / 2.0 + 20.0 + (aisle as f32 + 1.0) * AISLE_SPACING;
        let mid_x = (aisle_x + next_aisle_x) / 2.0;
        let cross_aisle_width = AISLE_SPACING - AISLE_WIDTH - 4.0;

        if (x - mid_x).abs() < cross_aisle_width / 2.0 {
            let y_in_bounds = y.abs() < height / 2.0 - 5.0;
            if y_in_bounds {
                return true;
            }
        }
    }

    if ((y - top_walkway_y).abs() < WALKWAY_WIDTH / 2.0
        || (y - bottom_walkway_y).abs() < WALKWAY_WIDTH / 2.0)
        && x.abs() < width / 2.0 - 10.0
    {
        return true;
    }

    false
}

fn find_nearest_valid_position(x: f32, y: f32, width: f32, height: f32) -> (f32, f32) {
    let mut nearest_aisle_x = -width / 2.0 + 20.0;
    let mut min_dist = (x - nearest_aisle_x).abs();

    for aisle in 1..NUM_AISLES {
        let aisle_x = -width / 2.0 + 20.0 + (aisle as f32) * AISLE_SPACING;
        let dist = (x - aisle_x).abs();
        if dist < min_dist {
            min_dist = dist;
            nearest_aisle_x = aisle_x;
        }
    }

    let clamped_y = clamp(y, -height / 2.0 + 10.0, height / 2.0 - 10.0);
    (nearest_aisle_x, clamped_y)
}

fn get_valid_destination(width: f32, height: f32) -> (f32, f32) {
    for _ in 0..50 {
        if random_f32() > 0.2 {
            let aisle_num = (random_f32() * NUM_AISLES as f32).floor() as i32;
            let aisle_x = -width / 2.0 + 20.0 + (aisle_num as f32) * AISLE_SPACING;
            let y = random_f32() * (height - 30.0) - (height - 30.0) / 2.0;
            return (aisle_x, y);
        } else {
            let x = random_f32() * width - width / 2.0;
            let y = random_f32() * height - height / 2.0;
            if is_in_aisle_walkway(x, y, width, height) {
                return (x, y);
            }
        }
    }

    let aisle_num = (random_f32() * NUM_AISLES as f32).floor() as i32;
    let aisle_x = -width / 2.0 + 20.0 + (aisle_num as f32) * AISLE_SPACING;
    (aisle_x, 0.0)
}

fn check_product_collision(x: f32, y: f32, products: &[f32]) -> Option<(f32, f32)> {
    for chunk in products.chunks_exact(2) {
        let dx = x - chunk[0];
        let dy = y - chunk[1];
        let distance = (dx * dx + dy * dy).sqrt();
        if distance < ROBOT_RADIUS + PRODUCT_RADIUS + COLLISION_BUFFER {
            return Some((chunk[0], chunk[1]));
        }
    }
    None
}

fn shortest_angle_diff(target: f32, current: f32) -> f32 {
    let mut diff = (target - current + std::f32::consts::PI) % (std::f32::consts::PI * 2.0)
        - std::f32::consts::PI;
    if diff < -std::f32::consts::PI {
        diff += std::f32::consts::PI * 2.0;
    }
    diff
}

#[wasm_bindgen]
pub fn update_robots(robots: &[f32], products: &[f32], bounds: &[f32], delta_ms: f32) -> Vec<f32> {
    if !robots.len().is_multiple_of(7) {
        return Vec::new();
    }

    let width = bounds.first().copied().unwrap_or(250.0);
    let height = bounds.get(1).copied().unwrap_or(150.0);
    let delta = if delta_ms > 0.0 {
        delta_ms
    } else {
        UPDATE_INTERVAL_DEFAULT
    };
    let mut output: Vec<f32> = Vec::with_capacity(robots.len());

    for chunk in robots.chunks_exact(7) {
        let x = chunk[0];
        let y = chunk[1];
        let mut dest_x = chunk[2];
        let mut dest_y = chunk[3];
        let mut orientation = chunk[4];
        let speed = chunk[5];
        let mut last_move_ms = chunk[6];

        if last_move_ms > STUCK_TIMEOUT {
            let (nx, ny) = get_valid_destination(width, height);
            dest_x = nx;
            dest_y = ny;
            last_move_ms = 0.0;
        }

        let mut dx = dest_x - x;
        let mut dy = dest_y - y;
        let mut distance = (dx * dx + dy * dy).sqrt();

        if distance < 2.0 {
            let (nx, ny) = get_valid_destination(width, height);
            dest_x = nx;
            dest_y = ny;
            dx = dest_x - x;
            dy = dest_y - y;
            distance = (dx * dx + dy * dy).sqrt();
        }

        let move_amount = speed * (delta / 1000.0);
        let move_x = if distance > 0.0001 {
            dx / distance * move_amount
        } else {
            0.0
        };
        let move_y = if distance > 0.0001 {
            dy / distance * move_amount
        } else {
            0.0
        };

        let mut new_x = x + move_x;
        let mut new_y = y + move_y;

        if !is_in_aisle_walkway(x, y, width, height) {
            let (valid_x, valid_y) = find_nearest_valid_position(x, y, width, height);
            let (nx, ny) = get_valid_destination(width, height);
            output.extend_from_slice(&[valid_x, valid_y, nx, ny, orientation, speed, 0.0]);
            continue;
        }

        if !is_in_aisle_walkway(new_x, new_y, width, height) {
            if is_in_aisle_walkway(new_x, y, width, height) {
                new_y = y;
            } else if is_in_aisle_walkway(x, new_y, width, height) {
                new_x = x;
            } else {
                let (nx, ny) = get_valid_destination(width, height);
                dest_x = nx;
                dest_y = ny;
                new_x = x;
                new_y = y;
            }
        }

        if let Some((px, py)) = check_product_collision(new_x, new_y, products) {
            let dxp = x - px;
            let dyp = y - py;
            let dist = (dxp * dxp + dyp * dyp).sqrt().max(0.0001);

            let normal_x = dxp / dist;
            let normal_y = dyp / dist;

            let to_dest_x = dest_x - x;
            let to_dest_y = dest_y - y;
            let to_dest_dist = (to_dest_x * to_dest_x + to_dest_y * to_dest_y)
                .sqrt()
                .max(0.0001);
            let to_dest_norm_x = to_dest_x / to_dest_dist;
            let to_dest_norm_y = to_dest_y / to_dest_dist;

            let dot = to_dest_norm_x * normal_x + to_dest_norm_y * normal_y;
            let reflected_x = to_dest_norm_x - 2.0 * dot * normal_x;
            let reflected_y = to_dest_norm_y - 2.0 * dot * normal_y;

            let bounce_distance = 50.0;
            dest_x = x + reflected_x * bounce_distance;
            dest_y = y + reflected_y * bounce_distance;

            dest_x = clamp(dest_x, -width / 2.0 + 10.0, width / 2.0 - 10.0);
            dest_y = clamp(dest_y, -height / 2.0 + 10.0, height / 2.0 - 10.0);

            if !is_in_aisle_walkway(dest_x, dest_y, width, height) {
                let (nx, ny) = get_valid_destination(width, height);
                dest_x = nx;
                dest_y = ny;
            }

            let push_distance = ROBOT_RADIUS + PRODUCT_RADIUS + COLLISION_BUFFER + 0.2;
            new_x = px + normal_x * push_distance;
            new_y = py + normal_y * push_distance;

            if !is_in_aisle_walkway(new_x, new_y, width, height) {
                new_x = x;
                new_y = y;
                let (nx, ny) = get_valid_destination(width, height);
                dest_x = nx;
                dest_y = ny;
            }
        }

        let target_orientation = (new_x - x).atan2(new_y - y);
        let orientation_diff = shortest_angle_diff(target_orientation, orientation);
        orientation += orientation_diff * 0.25;

        let has_moved = (new_x - x).abs() > 0.01 || (new_y - y).abs() > 0.01;
        last_move_ms = if has_moved { 0.0 } else { last_move_ms + delta };

        output.extend_from_slice(&[
            new_x,
            new_y,
            dest_x,
            dest_y,
            orientation,
            speed,
            last_move_ms,
        ]);
    }

    output
}
