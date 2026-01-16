use crate::constants::*;
use crate::geometry::clamp;

pub fn world_to_col(x: f32, width: f32) -> i32 {
    let col = ((x + width / 2.0) / NAV_CELL_SIZE).floor() as i32;
    col
}

pub fn world_to_row(y: f32, height: f32) -> i32 {
    let row = ((y + height / 2.0) / NAV_CELL_SIZE).floor() as i32;
    row
}

pub fn cell_center_x(col: i32, width: f32) -> f32 {
    col as f32 * NAV_CELL_SIZE - width / 2.0 + NAV_CELL_SIZE / 2.0
}

pub fn cell_center_y(row: i32, height: f32) -> f32 {
    row as f32 * NAV_CELL_SIZE - height / 2.0 + NAV_CELL_SIZE / 2.0
}

pub fn build_nav_grid(config: &StoreConfig) -> Vec<Vec<bool>> {
    let cols = (config.store_width / NAV_CELL_SIZE).ceil() as i32;
    let rows = (config.store_height / NAV_CELL_SIZE).ceil() as i32;
    let mut grid = vec![vec![true; cols as usize]; rows as usize];

    let half_shelf = config.aisle_width / 2.0 + 1.5;
    for aisle in 0..config.aisle_count {
        let center_x = config.get_aisle_center(aisle);
        let min_x = center_x - half_shelf;
        let max_x = center_x + half_shelf;
        let min_col = clamp(
            world_to_col(min_x, config.store_width) as f32,
            0.0,
            cols as f32 - 1.0,
        ) as i32;
        let max_col = clamp(
            world_to_col(max_x, config.store_width) as f32,
            0.0,
            cols as f32 - 1.0,
        ) as i32;
        for col in min_col..=max_col {
            for row in 0..rows {
                grid[row as usize][col as usize] = false;
            }
        }
    }

    grid
}

pub fn is_in_aisle_walkway(x: f32, y: f32, config: &StoreConfig) -> bool {
    let top_walkway_y = config.store_height / 2.0 - config.walkway_width;
    let bottom_walkway_y = -config.store_height / 2.0 + config.walkway_width;

    for aisle in 0..(config.aisle_count - 1) {
        let aisle_x = config.get_aisle_center(aisle);
        let next_aisle_x = config.get_aisle_center(aisle + 1);
        let mid_x = (aisle_x + next_aisle_x) / 2.0;
        let cross_aisle_width = config.aisle_spacing - config.aisle_width - config.cross_aisle_buffer;

        if (x - mid_x).abs() < cross_aisle_width / 2.0 {
            let y_in_bounds = y.abs() < config.store_height / 2.0 - 5.0;
            if y_in_bounds {
                return true;
            }
        }
    }

    if ((y - top_walkway_y).abs() < config.walkway_width / 2.0
        || (y - bottom_walkway_y).abs() < config.walkway_width / 2.0)
        && x.abs() < config.store_width / 2.0 - 10.0
    {
        return true;
    }

    false
}
