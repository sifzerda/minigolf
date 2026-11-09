// src/renderers/CourseMapRenderer.jsx

import { useId, useMemo } from "react";

const WIDTH = 320;
const HEIGHT = 440;
const PADDING = 30;

const SURFACE_COLORS = {
  grass: "#328b50",
  sand: "#d8c18b",
  ice: "#8cdef0",
  concrete: "#999999",
  rock: "#777777",
  snow: "#e4edf0",
  water: "#1479a8",
};

const isPoint2 = (point) =>
  Array.isArray(point) &&
  point.length >= 2 &&
  Number.isFinite(point[0]) &&
  Number.isFinite(point[1]);

const isPoint3 = (point) =>
  Array.isArray(point) &&
  point.length >= 3 &&
  Number.isFinite(point[0]) &&
  Number.isFinite(point[2]);

function getBounds(course) {
  const points = (course.sections ?? [])
    .filter((section) => section.type === "floor")
    .flatMap((section) => section.points ?? [])
    .filter(isPoint2);

  if (!points.length) {
    return {
      minX: -4,
      maxX: 4,
      minZ: -10,
      maxZ: 10,
    };
  }

  return {
    minX: Math.min(...points.map((p) => p[0])),
    maxX: Math.max(...points.map((p) => p[0])),
    minZ: Math.min(...points.map((p) => p[1])),
    maxZ: Math.max(...points.map((p) => p[1])),
  };
}

function polygonPoints(points, project) {
  return points
    .filter(isPoint2)
    .map(([x, z]) => project(x, z).join(","))
    .join(" ");
}

function getSurfaceColor(surface) {
  const type = surface.surface ?? surface.type;

  return (
    surface.color ??
    SURFACE_COLORS[type] ??
    SURFACE_COLORS.grass
  );
}

function MapSurface({ surface, project, scale }) {
  const color = getSurfaceColor(surface);
  const type = surface.surface ?? surface.type;

  const stroke =
    type === "water" ? "#7bd8f5" : "#ffffff";

  // Irregular polygon-shaped surfaces.
  if (
    Array.isArray(surface.points) &&
    surface.points.length >= 3
  ) {
    return (
      <polygon
        points={polygonPoints(surface.points, project)}
        fill={color}
        stroke={stroke}
        strokeWidth={type === "water" ? 1.8 : 1}
        strokeLinejoin="round"
        opacity={type === "water" ? 0.95 : 0.9}
      />
    );
  }

  // Rectangular surfaces.
  if (
    !isPoint3(surface.position) ||
    !Array.isArray(surface.size)
  ) {
    return null;
  }

  const [x, , z] = surface.position;
  const [width, length] = surface.size;

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(length)
  ) {
    return null;
  }

  const [cx, cy] = project(x, z);

  return (
    <rect
      x={cx - width * scale / 2}
      y={cy - length * scale / 2}
      width={width * scale}
      height={length * scale}
      fill={color}
      stroke={stroke}
      strokeWidth="1"
      opacity="0.9"
    />
  );
}

function MapRamp({
  ramp,
  project,
  scale,
  gradientId,
}) {
  if (
    !isPoint3(ramp.position) ||
    !Array.isArray(ramp.size)
  ) {
    return null;
  }

  const [x, , z] = ramp.position;
  const [width, height, length] = ramp.size;

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(length)
  ) {
    return null;
  }

  const [cx, cy] = project(x, z);

  const w = width * scale;
  const l = length * scale;

  // RampRenderer uses Y-axis rotation.
  const angle = ramp.angle ?? 0;
  const rotation = angle * 180 / Math.PI;

  return (
    <g transform={`translate(${cx} ${cy}) rotate(${-rotation})`}>
      <rect
        x={-w / 2}
        y={-l / 2}
        width={w}
        height={l}
        fill={ramp.color ?? "#b8a58a"}
        stroke="#f1e0b6"
        strokeWidth="1.5"
      />

      {/* Height gradient:
          high end at negative Z (top). */}
      <rect
        x={-w / 2}
        y={-l / 2}
        width={w}
        height={l}
        fill={`url(#${gradientId})`}
      />

      {/* Launch edge */}
      <line
        x1={-w / 2}
        y1={-l / 2}
        x2={w / 2}
        y2={-l / 2}
        stroke="#fff0c9"
        strokeWidth="2.5"
      />

      {/* Entrance edge */}
      <line
        x1={-w / 2}
        y1={l / 2}
        x2={w / 2}
        y2={l / 2}
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.4"
      />

      {height > 0 && (
        <path
          d={`M 0 ${l * 0.28} L 0 ${-l * 0.28}
              M -4 ${-l * 0.17} L 0 ${-l * 0.28}
              L 4 ${-l * 0.17}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      )}
    </g>
  );
}

function RotatedRectangle({
  position,
  size,
  angle = 0,
  color,
  project,
  scale,
  stroke = "#ffffff",
}) {
  if (
    !isPoint3(position) ||
    !Array.isArray(size)
  ) {
    return null;
  }

  const [cx, cy] = project(position[0], position[2]);

  const width = size[0] * scale;
  const length = size[2] * scale;

  return (
    <rect
      x={-width / 2}
      y={-length / 2}
      width={width}
      height={length}
      fill={color}
      stroke={stroke}
      strokeWidth="1.5"
      transform={`translate(${cx} ${cy}) rotate(${
        -(angle * 180 / Math.PI)
      })`}
    />
  );
}

function MapObstacle({ obstacle, project, scale }) {
  const {
    type,
    position,
    start,
    end,
    size,
    radius,
    distance = 0,
    axis = "x",
    color = "#ffcc33",
  } = obstacle;

  if (type === "cliff" || type === "ledge") {
    if (!isPoint2(start) || !isPoint2(end)) {
      return null;
    }

    const [x1, y1] = project(start[0], start[1]);
    const [x2, y2] = project(end[0], end[1]);

    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={
          type === "cliff"
            ? 5
            : Math.max(
                2,
                (obstacle.width ?? 2) * scale
              )
        }
        strokeDasharray={
          type === "cliff" ? "8 4" : undefined
        }
        strokeLinecap="round"
        opacity="0.85"
      />
    );
  }

  if (type === "plateau") {
    if (!isPoint2(position)) return null;

    const [cx, cy] = project(
      position[0],
      position[1]
    );

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={(radius ?? 2) * scale}
          fill={
            color === "#ffcc33"
              ? "#725a45"
              : color
          }
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.85"
        />

        <circle
          cx={cx}
          cy={cy}
          r={Math.max(
            1,
            ((radius ?? 2) -
              (obstacle.edgeWidth ?? 0.5)) * scale
          )}
          fill="none"
          stroke="#ffffff"
          strokeDasharray="4 4"
          opacity="0.5"
        />
      </g>
    );
  }

  if (!isPoint3(position)) return null;

  const [cx, cy] = project(
    position[0],
    position[2]
  );

  if (type === "bumper") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={(radius ?? 0.4) * scale}
        fill={color}
        stroke="#ffffff"
        strokeWidth="1.5"
      />
    );
  }

  if (
    type === "block" ||
    type === "movingBarrier" ||
    type === "movingPlatform"
  ) {
    const isMoving =
      type === "movingBarrier" ||
      type === "movingPlatform";

    const travel = Math.max(0, distance) * scale;

    return (
      <g>
        {isMoving && travel > 0 && (
          <line
            x1={
              cx - (axis === "x" ? travel : 0)
            }
            y1={
              cy - (axis === "z" ? travel : 0)
            }
            x2={
              cx + (axis === "x" ? travel : 0)
            }
            y2={
              cy + (axis === "z" ? travel : 0)
            }
            stroke={color}
            strokeWidth="2"
            strokeDasharray="5 5"
            opacity="0.65"
          />
        )}

        <RotatedRectangle
          position={position}
          size={size}
          angle={
            obstacle.angle ??
            obstacle.rotation?.[1] ??
            0
          }
          color={color}
          project={project}
          scale={scale}
        />

        {isMoving && axis === "y" && (
          <circle
            cx={cx}
            cy={cy}
            r="4"
            fill="#ffffff"
          />
        )}
      </g>
    );
  }

  if (type === "turnstile") {
    const length =
      (obstacle.bladeLength ?? 5) * scale;

    const thickness =
      (obstacle.bladeWidth ?? 0.35) * scale;

    return (
      <g
        transform={`translate(${cx} ${cy}) rotate(${
          -(
            (obstacle.angle ??
              obstacle.rotation?.[1] ??
              0) *
            180 /
            Math.PI
          )
        })`}
      >
        <rect
          x={-length / 2}
          y={-thickness / 2}
          width={length}
          height={thickness}
          fill={color}
          stroke="#ffffff"
          strokeWidth="1"
        />

        <rect
          x={-thickness / 2}
          y={-length / 2}
          width={thickness}
          height={length}
          fill={color}
          stroke="#ffffff"
          strokeWidth="1"
        />

        <circle
          r="5"
          fill="#333333"
          stroke="#ffffff"
        />
      </g>
    );
  }

  return null;
}

function MapWall({ wall, project, scale }) {
  return (
    <RotatedRectangle
      position={wall.position}
      size={
        wall.size ?? [
          wall.length ?? 1,
          wall.height ?? 0.8,
          wall.thickness ?? 0.2,
        ]
      }
      angle={wall.rotation?.[1] ?? 0}
      color={wall.color ?? "#795548"}
      project={project}
      scale={scale}
      stroke="#a78b70"
    />
  );
}

export default function CourseMapRenderer({ course }) {
  const gradientId = useId().replace(/:/g, "");

  const bounds = useMemo(
    () => getBounds(course),
    [course]
  );

  const scale = Math.min(
    (WIDTH - PADDING * 2) /
      Math.max(1, bounds.maxX - bounds.minX),
    (HEIGHT - PADDING * 2) /
      Math.max(1, bounds.maxZ - bounds.minZ)
  );

  const centerX =
    (bounds.minX + bounds.maxX) / 2;

  const centerZ =
    (bounds.minZ + bounds.maxZ) / 2;

  function project(x, z) {
    return [
      WIDTH / 2 + (x - centerX) * scale,
      HEIGHT / 2 + (z - centerZ) * scale,
    ];
  }

  const ballPosition = isPoint3(course.ballStart)
    ? course.ballStart
    : [0, 0, 0];

  const holePosition = isPoint3(
    course.hole?.position
  )
    ? course.hole.position
    : [0, 0, 0];

  const [ballX, ballY] = project(
    ballPosition[0],
    ballPosition[2]
  );

  const [holeX, holeY] = project(
    holePosition[0],
    holePosition[2]
  );

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="block h-auto max-h-[500px] w-full rounded-xl"
      role="img"
      aria-label={`Map of ${course.name}`}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="100%"
          x2="0%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#ffffff"
            stopOpacity="0.02"
          />
          <stop
            offset="100%"
            stopColor="#ffffff"
            stopOpacity="0.38"
          />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect
        width={WIDTH}
        height={HEIGHT}
        fill="#152023"
        rx="14"
      />

      {/* Course floor polygons */}
      {(course.sections ?? [])
        .filter(
          (section) =>
            section.type === "floor" &&
            Array.isArray(section.points)
        )
        .map((section, index) => (
          <polygon
            key={section.id ?? index}
            points={polygonPoints(
              section.points,
              project
            )}
            fill={section.color ?? "#328b50"}
            stroke="#a67b52"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        ))}

      {/* Surface regions */}
      {(course.surfaces ?? []).map(
        (surface, index) => (
          <MapSurface
            key={surface.id ?? index}
            surface={surface}
            project={project}
            scale={scale}
          />
        )
      )}

      {/* Wedge ramps */}
      {(course.ramps ?? []).map(
        (ramp, index) => (
          <MapRamp
            key={ramp.id ?? index}
            ramp={ramp}
            project={project}
            scale={scale}
            gradientId={gradientId}
          />
        )
      )}

      {/* Course obstacles */}
      {(course.obstacles ?? []).map(
        (obstacle, index) => (
          <MapObstacle
            key={obstacle.id ?? index}
            obstacle={obstacle}
            project={project}
            scale={scale}
          />
        )
      )}

      {/* Boundary walls */}
      {(course.walls ?? []).map(
        (wall, index) => (
          <MapWall
            key={wall.id ?? index}
            wall={wall}
            project={project}
            scale={scale}
          />
        )
      )}

      {/* Golf hole */}
      {course.hole && (
        <circle
          cx={holeX}
          cy={holeY}
          r={Math.max(
            4,
            (course.hole.radius ?? 0.4) * scale
          )}
          fill="#111111"
          stroke="#eeeeee"
          strokeWidth="2"
        />
      )}

      {/* Starting ball */}
      <circle
        cx={ballX}
        cy={ballY}
        r="5"
        fill="#ffffff"
        stroke="#222222"
        strokeWidth="2"
      />
    </svg>
  );
}
