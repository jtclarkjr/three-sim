use crate::constants::*;
use crate::geometry::*;
use crate::grid::is_in_row_walkway;

pub fn find_nearest_valid_position(x: f32, y: f32, config: &StoreConfig) -> (f32, f32) {
    let mut nearest_row_x = config.get_row_center(0);
    let mut min_dist = (x - nearest_row_x).abs();

    for row in 1..config.row_count {
        let row_x = config.get_row_center(row);
        let dist = (x - row_x).abs();
        if dist < min_dist {
            min_dist = dist;
            nearest_row_x = row_x;
        }
    }

    let clamped_y = clamp(
        y,
        -config.store_height / 2.0 + 10.0,
        config.store_height / 2.0 - 10.0,
    );
    (nearest_row_x, clamped_y)
}

pub fn get_valid_destination(config: &StoreConfig) -> (f32, f32) {
    for _ in 0..50 {
        if random_f32() > 0.2 {
            let row_num = (random_f32() * config.row_count as f32).floor() as i32;
            let row_x = config.get_row_center(row_num);
            let y = random_f32() * (config.store_height - 30.0) - (config.store_height - 30.0) / 2.0;
            return (row_x, y);
        } else {
            let x = random_f32() * config.store_width - config.store_width / 2.0;
            let y = random_f32() * config.store_height - config.store_height / 2.0;
            if is_in_row_walkway(x, y, config) {
                return (x, y);
            }
        }
    }

    let row_num = (random_f32() * config.row_count as f32).floor() as i32;
    let row_x = config.get_row_center(row_num);
    (row_x, 0.0)
}

pub fn check_product_collision(x: f32, y: f32, products: &[f32]) -> Option<(f32, f32)> {
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

pub fn check_product_collision_along_segment(
    x1: f32,
    y1: f32,
    x2: f32,
    y2: f32,
    products: &[f32],
) -> Option<(f32, f32)> {
    let radius = ROBOT_RADIUS + PRODUCT_RADIUS + COLLISION_BUFFER;
    let seg_dx = x2 - x1;
    let seg_dy = y2 - y1;
    let seg_len_sq = seg_dx * seg_dx + seg_dy * seg_dy;
    for chunk in products.chunks_exact(2) {
        let px = chunk[0];
        let py = chunk[1];
        let t = if seg_len_sq > 0.0001 {
            ((px - x1) * seg_dx + (py - y1) * seg_dy) / seg_len_sq
        } else {
            0.0
        };
        let clamped_t = t.clamp(0.0, 1.0);
        let closest_x = x1 + seg_dx * clamped_t;
        let closest_y = y1 + seg_dy * clamped_t;
        let dx = closest_x - px;
        let dy = closest_y - py;
        if dx * dx + dy * dy < radius * radius {
            return Some((px, py));
        }
    }
    None
}

pub fn update_single_robot(
    x: f32,
    y: f32,
    dest_x: f32,
    dest_y: f32,
    orientation: f32,
    speed: f32,
    last_move_ms: f32,
    products: &[f32],
    config: &StoreConfig,
    delta: f32,
) -> [f32; 7] {
    let mut dest_x = dest_x;
    let mut dest_y = dest_y;
    let mut orientation = orientation;
    let mut last_move_ms = last_move_ms;

    if last_move_ms > STUCK_TIMEOUT {
        let (nx, ny) = get_valid_destination(config);
        dest_x = nx;
        dest_y = ny;
        last_move_ms = 0.0;
    }

    let mut dx = dest_x - x;
    let mut dy = dest_y - y;
    let mut distance = (dx * dx + dy * dy).sqrt();

    if distance < 2.0 {
        let (nx, ny) = get_valid_destination(config);
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

    if !is_in_row_walkway(x, y, config) {
        let (valid_x, valid_y) = find_nearest_valid_position(x, y, config);
        let (nx, ny) = get_valid_destination(config);
        return [valid_x, valid_y, nx, ny, orientation, speed, 0.0];
    }

    if !is_in_row_walkway(new_x, new_y, config) {
        let (nx, ny) = get_valid_destination(config);
        return [x, y, nx, ny, orientation, speed, 0.0];
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

        dest_x = clamp(
            dest_x,
            -config.store_width / 2.0 + 10.0,
            config.store_width / 2.0 - 10.0,
        );
        dest_y = clamp(
            dest_y,
            -config.store_height / 2.0 + 10.0,
            config.store_height / 2.0 - 10.0,
        );

        if !is_in_row_walkway(dest_x, dest_y, config) {
            let (nx, ny) = get_valid_destination(config);
            dest_x = nx;
            dest_y = ny;
        }

        let push_distance = ROBOT_RADIUS + PRODUCT_RADIUS + COLLISION_BUFFER + 0.2;
        new_x = px + normal_x * push_distance;
        new_y = py + normal_y * push_distance;

        if !is_in_row_walkway(new_x, new_y, config) {
            new_x = x;
            new_y = y;
            let (nx, ny) = get_valid_destination(config);
            dest_x = nx;
            dest_y = ny;
        }
    }

    let target_orientation = (new_x - x).atan2(new_y - y);
    let orientation_diff = shortest_angle_diff(target_orientation, orientation);
    orientation += orientation_diff * 0.25;

    let has_moved = (new_x - x).abs() > 0.01 || (new_y - y).abs() > 0.01;
    last_move_ms = if has_moved { 0.0 } else { last_move_ms + delta };

    [
        new_x,
        new_y,
        dest_x,
        dest_y,
        orientation,
        speed,
        last_move_ms,
    ]
}

pub fn move_to_waypoint(
  x: f32,
  y: f32,
  orientation: f32,
  speed: f32,
  waypoint_x: f32,
  waypoint_y: f32,
  delta_ms: f32,
) -> [f32; 3] {
    let delta_seconds = delta_ms / 1000.0;
    let dx = waypoint_x - x;
    let dy = waypoint_y - y;
    let distance = (dx * dx + dy * dy).sqrt();

    if distance < 0.01 {
        return [x, y, orientation];
    }

    let direction = dy.atan2(dx);
    let step = speed * delta_seconds;
    let clamped_step = step.min(distance);

    let new_x = x + direction.cos() * clamped_step;
    let new_y = y + direction.sin() * clamped_step;

  [new_x, new_y, direction]
}

pub fn move_to_waypoint_with_collision(
    x: f32,
    y: f32,
    orientation: f32,
    speed: f32,
    waypoint_x: f32,
    waypoint_y: f32,
    delta_ms: f32,
    products: &[f32],
    config: &StoreConfig,
) -> [f32; 3] {
    let delta_seconds = delta_ms / 1000.0;
    let dx = waypoint_x - x;
    let dy = waypoint_y - y;
    let distance = (dx * dx + dy * dy).sqrt();

    if distance < 0.01 {
        return [x, y, orientation];
    }

    let direction = dy.atan2(dx);
    let step = speed * delta_seconds;
    let clamped_step = step.min(distance);

    let mut new_x = x + direction.cos() * clamped_step;
    let mut new_y = y + direction.sin() * clamped_step;

    if !is_in_row_walkway(x, y, config) {
        let (valid_x, valid_y) = find_nearest_valid_position(x, y, config);
        return [valid_x, valid_y, orientation];
    }

    if !is_in_row_walkway(new_x, new_y, config) {
        if is_in_row_walkway(new_x, y, config) {
            new_y = y;
        } else if is_in_row_walkway(x, new_y, config) {
            new_x = x;
        } else {
            return [x, y, orientation];
        }
    }

    if let Some((px, py)) =
        check_product_collision_along_segment(x, y, new_x, new_y, products)
    {
        let dxp = new_x - px;
        let dyp = new_y - py;
        let dist = (dxp * dxp + dyp * dyp).sqrt().max(0.0001);

        let normal_x = dxp / dist;
        let normal_y = dyp / dist;

        let push_distance = ROBOT_RADIUS + PRODUCT_RADIUS + COLLISION_BUFFER + 0.2;
        new_x = px + normal_x * push_distance;
        new_y = py + normal_y * push_distance;

        if !is_in_row_walkway(new_x, new_y, config) {
            new_x = x;
            new_y = y;
        }
    }

    [new_x, new_y, direction]
}

pub fn check_arrival(robot_x: f32, robot_y: f32, waypoint_x: f32, waypoint_y: f32) -> bool {
    let dx = robot_x - waypoint_x;
    let dy = robot_y - waypoint_y;
    let distance_sq = dx * dx + dy * dy;
    distance_sq <= ARRIVAL_DISTANCE_SQUARED
}
