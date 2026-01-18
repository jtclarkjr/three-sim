pub const UPDATE_INTERVAL_DEFAULT: f32 = 50.0;
pub const STUCK_TIMEOUT: f32 = 3000.0;
pub const ROBOT_RADIUS: f32 = 2.0;
pub const PRODUCT_RADIUS: f32 = 0.5;
pub const COLLISION_BUFFER: f32 = 0.5;
pub const NAV_CELL_SIZE: f32 = 5.0;
pub const ARRIVAL_DISTANCE: f32 = 2.5;
pub const ARRIVAL_DISTANCE_SQUARED: f32 = ARRIVAL_DISTANCE * ARRIVAL_DISTANCE;

#[derive(Clone, Copy, Debug)]
pub enum Orientation {
    Vertical = 0,
    Horizontal = 1,
}

#[derive(Clone, Copy, Debug)]
pub struct StoreConfig {
    pub store_width: f32,
    pub store_height: f32,
    pub row_count: i32,
    pub row_spacing: f32,
    pub row_thickness: f32,
    pub start_offset: f32,
    pub walkway_width: f32,
    pub cross_row_buffer: f32,
    pub outer_walkway_offset: f32,
    pub orientation: Orientation,
}

impl StoreConfig {
    pub fn from_buffer(config: &[f32]) -> Self {
        StoreConfig {
            store_width: config.get(0).copied().unwrap_or(250.0),
            store_height: config.get(1).copied().unwrap_or(150.0),
            row_count: config.get(2).copied().unwrap_or(6.0) as i32,
            row_spacing: config.get(3).copied().unwrap_or(40.0),
            row_thickness: config.get(4).copied().unwrap_or(6.0),
            start_offset: config.get(5).copied().unwrap_or(20.0),
            walkway_width: config.get(6).copied().unwrap_or(10.0),
            cross_row_buffer: config.get(7).copied().unwrap_or(4.0),
            outer_walkway_offset: config.get(8).copied().unwrap_or(12.0),
            orientation: if config.get(9).copied().unwrap_or(0.0) > 0.5 {
                Orientation::Horizontal
            } else {
                Orientation::Vertical
            },
        }
    }

    pub fn get_row_center(&self, row_index: i32) -> f32 {
        -self.store_width / 2.0 + self.start_offset + (row_index as f32) * self.row_spacing
    }

    pub fn transform_coords(&self, x: f32, y: f32) -> (f32, f32) {
        match self.orientation {
            Orientation::Horizontal => (y, x),
            Orientation::Vertical => (x, y),
        }
    }

    pub fn transform_orientation(&self, angle: f32) -> f32 {
        match self.orientation {
            Orientation::Horizontal => std::f32::consts::FRAC_PI_2 - angle,
            Orientation::Vertical => angle,
        }
    }
}
