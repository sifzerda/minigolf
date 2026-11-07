// src/courses/courseBuilder.js

export function createPolygonFloor({
  id = "main-floor",
  points,
  y = 0,
  color = "#25834a",
  friction = 0.85,
}) {
  return {
    id,
    type: "floor",
    points,
    y,
    color,
    friction,
  };
}

export function createRectangularFloor({
  id = "main-floor",
  width = 8,
  length = 20,
  x = 0,
  z = 0,
  y = 0,
  color = "#25834a",
}) {
  const hw = width / 2;
  const hl = length / 2;

  return createPolygonFloor({
    id,
    y,
    color,
    points: [
      [x - hw, z - hl],
      [x + hw, z - hl],
      [x + hw, z + hl],
      [x - hw, z + hl],
    ],
  });
}

export function createRamp({
  id,
  x = 0,
  z = 0,
  width = 3,
  length = 4,
  thickness = 0.2,
  angle = 0.2,
  color = "#328b50",
}) {
  const height =
    (length / 2) * Math.sin(Math.abs(angle)) +
    (thickness / 2) * Math.cos(angle);

  return {
    id,
    type: "ramp",
    position: [x, height, z],
    size: [width, thickness, length],
    rotation: [angle, 0, 0],
    color,
    friction: 0.85,
  };
}

export function createWall({
  id,
  position,
  size,
  rotation = [0, 0, 0],
  color = "#795548",
}) {
  return {
    id,
    position,
    size,
    rotation,
    color,
  };
}

export function createPolygonWalls({
  points,
  y = 0,
  height = 0.6,
  thickness = 0.3,
  color = "#795548",
}) {
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length];

    const dx = next[0] - point[0];
    const dz = next[1] - point[1];

    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);

    return createWall({
      id: `boundary-${index}`,
      position: [
        (point[0] + next[0]) / 2,
        y + height / 2,
        (point[1] + next[1]) / 2,
      ],
      size: [length, height, thickness],
      rotation: [0, angle, 0],
      color,
    });
  });
}
