use js_sys::Math;

pub fn random_f32() -> f32 {
    Math::random() as f32
}

pub fn clamp(value: f32, min: f32, max: f32) -> f32 {
    value.max(min).min(max)
}

pub fn shortest_angle_diff(target: f32, current: f32) -> f32 {
    let mut diff = (target - current + std::f32::consts::PI) % (std::f32::consts::PI * 2.0)
        - std::f32::consts::PI;
    if diff < -std::f32::consts::PI {
        diff += std::f32::consts::PI * 2.0;
    }
    diff
}
