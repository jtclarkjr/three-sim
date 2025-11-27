use crate::constants::*;
use crate::geometry::clamp;
use crate::grid::*;
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap, HashSet};

#[derive(Copy, Clone, Eq, PartialEq)]
pub struct Node {
    pub col: i32,
    pub row: i32,
    pub f_score: i32,
}

impl Ord for Node {
    fn cmp(&self, other: &Self) -> Ordering {
        other.f_score.cmp(&self.f_score)
    }
}

impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn heuristic(a: (i32, i32), b: (i32, i32)) -> i32 {
    (a.0 - b.0).abs() + (a.1 - b.1).abs()
}

fn neighbors(col: i32, row: i32, grid: &[Vec<bool>]) -> Vec<(i32, i32)> {
    let mut list = Vec::new();
    let max_col = grid.first().map(|r| r.len() as i32).unwrap_or(0) - 1;
    let max_row = grid.len() as i32 - 1;
    if col > 0 {
        list.push((col - 1, row))
    }
    if col < max_col {
        list.push((col + 1, row))
    }
    if row > 0 {
        list.push((col, row - 1))
    }
    if row < max_row {
        list.push((col, row + 1))
    }
    list.into_iter()
        .filter(|(c, r)| {
            grid.get(*r as usize)
                .and_then(|row_vec| row_vec.get(*c as usize))
                .copied()
                .unwrap_or(false)
        })
        .collect()
}

fn find_nearest_walkable(col: i32, row: i32, grid: &[Vec<bool>]) -> (i32, i32) {
    if grid
        .get(row as usize)
        .and_then(|r| r.get(col as usize))
        .copied()
        .unwrap_or(false)
    {
        return (col, row);
    }
    let mut visited = HashSet::new();
    let mut queue = vec![(col, row)];
    while let Some((c, r)) = queue.pop() {
        if !visited.insert((c, r)) {
            continue;
        }
        if grid
            .get(r as usize)
            .and_then(|row_vec| row_vec.get(c as usize))
            .copied()
            .unwrap_or(false)
        {
            return (c, r);
        }
        if c > 0 {
            queue.push((c - 1, r))
        }
        if c + 1 < grid.first().map(|v| v.len() as i32).unwrap_or(0) {
            queue.push((c + 1, r))
        }
        if r > 0 {
            queue.push((c, r - 1))
        }
        if r + 1 < grid.len() as i32 {
            queue.push((c, r + 1))
        }
    }
    (col, row)
}

pub fn find_path(start: (f32, f32), end: (f32, f32), width: f32, height: f32) -> Vec<(f32, f32)> {
    let grid = build_nav_grid(width, height);
    let max_col = grid.first().map(|r| r.len() as i32).unwrap_or(0) - 1;
    let max_row = grid.len() as i32 - 1;
    if max_col < 0 || max_row < 0 {
        return vec![start, end];
    }

    let mut start_col = world_to_col(start.0, width);
    let mut start_row = world_to_row(start.1, height);
    start_col = clamp(start_col as f32, 0.0, max_col as f32) as i32;
    start_row = clamp(start_row as f32, 0.0, max_row as f32) as i32;

    let mut end_col = world_to_col(end.0, width);
    let mut end_row = world_to_row(end.1, height);
    end_col = clamp(end_col as f32, 0.0, max_col as f32) as i32;
    end_row = clamp(end_row as f32, 0.0, max_row as f32) as i32;

    let (start_col, start_row) = find_nearest_walkable(start_col, start_row, &grid);
    let (end_col, end_row) = find_nearest_walkable(end_col, end_row, &grid);

    let mut open = BinaryHeap::new();
    let mut came_from: HashMap<(i32, i32), (i32, i32)> = HashMap::new();
    let mut g_score: HashMap<(i32, i32), i32> = HashMap::new();
    let mut f_score: HashMap<(i32, i32), i32> = HashMap::new();

    g_score.insert((start_col, start_row), 0);
    f_score.insert(
        (start_col, start_row),
        heuristic((start_col, start_row), (end_col, end_row)),
    );
    open.push(Node {
        col: start_col,
        row: start_row,
        f_score: *f_score.get(&(start_col, start_row)).unwrap_or(&i32::MAX),
    });

    while let Some(current) = open.pop() {
        if current.col == end_col && current.row == end_row {
            let mut path = Vec::new();
            let mut curr = (current.col, current.row);
            path.push((cell_center_x(curr.0, width), cell_center_y(curr.1, height)));
            while let Some(prev) = came_from.get(&curr) {
                curr = *prev;
                path.push((cell_center_x(curr.0, width), cell_center_y(curr.1, height)));
            }
            path.reverse();
            return path;
        }

        for (nc, nr) in neighbors(current.col, current.row, &grid) {
            let tentative_g = g_score
                .get(&(current.col, current.row))
                .copied()
                .unwrap_or(i32::MAX / 2)
                + 1;
            if tentative_g < *g_score.get(&(nc, nr)).unwrap_or(&(i32::MAX / 2)) {
                came_from.insert((nc, nr), (current.col, current.row));
                g_score.insert((nc, nr), tentative_g);
                let f = tentative_g + heuristic((nc, nr), (end_col, end_row));
                f_score.insert((nc, nr), f);
                open.push(Node {
                    col: nc,
                    row: nr,
                    f_score: f,
                });
            }
        }
    }

    vec![start, end]
}

pub fn compute_path_with_outer_walkway(
    start: (f32, f32),
    end: (f32, f32),
    width: f32,
    height: f32,
) -> Vec<(f32, f32)> {
    let top_y = height / 2.0 - OUTER_WALKWAY_OFFSET;
    let bottom_y = -height / 2.0 + OUTER_WALKWAY_OFFSET;

    let build_route = |anchor_y: f32| {
        let leg1 = find_path(start, (start.0, anchor_y), width, height);
        let anchor_pt = *leg1.last().unwrap_or(&(start.0, anchor_y));
        let leg2 = find_path(anchor_pt, (end.0, anchor_y), width, height);
        let leg2_anchor = *leg2.last().unwrap_or(&(end.0, anchor_y));
        let leg3 = find_path(leg2_anchor, end, width, height);
        let mut stitched = Vec::new();
        stitched.extend(leg1);
        if !leg2.is_empty() {
            stitched.extend(leg2.into_iter().skip(1));
        }
        if !leg3.is_empty() {
            stitched.extend(leg3.into_iter().skip(1));
        }
        stitched
    };

    let top_route = build_route(top_y);
    let bottom_route = build_route(bottom_y);

    let distance = |path: &[(f32, f32)]| {
        let mut total = 0.0;
        for i in 1..path.len() {
            let dx = path[i].0 - path[i - 1].0;
            let dy = path[i].1 - path[i - 1].1;
            total += (dx * dx + dy * dy).sqrt();
        }
        total
    };

    if distance(&top_route) <= distance(&bottom_route) {
        top_route
    } else {
        bottom_route
    }
}
