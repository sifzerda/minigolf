// src/renderers/CourseMapRenderer.jsx

import { useMemo } from "react";

const WIDTH = 320;
const HEIGHT = 440;
const PADDING = 30;

const SURFACE_COLORS = {
  sand: "#d8c18b",
  ice: "#8cdef0",
  concrete: "#999999",
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

  const xs = points.map((point) => point[0]);
  const zs = points.map((point) => point[1]);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
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

  // Terrain-style line obstacles use 2D endpoints.
  if (type === "cliff" || type === "ledge") {
    if (!isPoint2(start) || !isPoint2(end)) {
      return null;
    }

    const [x1, y1] = project(start[0], start[1]);
    const [x2, y2] = project(end[0], end[1]);

    if (type === "cliff") {
      return (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="5"
          strokeDasharray="8 4"
          strokeLinecap="round"
        />
      );
    }

    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={Math.max(
          2,
          (obstacle.width ?? 2) * scale
        )}
        strokeLinecap="round"
        opacity="0.75"
      />
    );
  }

  // Plateau uses a 2D [x, z] position.
  if (type === "plateau") {
    if (!isPoint2(position)) return null;

    const [cx, cy] = project(position[0], position[1]);

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={(radius ?? 2) * scale}
          fill={color === "#ffcc33" ? "#725a45" : color}
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.8"
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
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.5"
        />
      </g>
    );
  }

  // Standard obstacles use [x, y, z].
  if (!isPoint3(position)) return null;

  const [cx, cy] = project(position[0], position[2]);

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
    if (
      !Array.isArray(size) ||
      !Number.isFinite(size[0]) ||
      !Number.isFinite(size[2])
    ) {
      return null;
    }

    const width = size[0] * scale;
    const depth = size[2] * scale;

    const isMoving =
      type === "movingBarrier" ||
      type === "movingPlatform";

    const travel = Math.max(0, distance) * scale;

    return (
      <g>
        {isMoving && travel > 0 && (
          <line
            x1={cx - (axis === "x" ? travel : 0)}
            y1={cy - (axis === "z" ? travel : 0)}
            x2={cx + (axis === "x" ? travel : 0)}
            y2={cy + (axis === "z" ? travel : 0)}
            stroke={color}
            strokeWidth="2"
            strokeDasharray="5 5"
            opacity="0.65"
          />
        )}

        <rect
          x={cx - width / 2}
          y={cy - depth / 2}
          width={width}
          height={depth}
          rx="2"
          fill={color}
          stroke="#ffffff"
          strokeWidth="1.5"
        />

        {isMoving && axis === "y" && (
          <circle
            cx={cx}
            cy={cy}
            r="4"
            fill="#ffffff"
            opacity="0.85"
          />
        )}
      </g>
    );
  }

  if (type === "turnstile") {
    const length = (obstacle.bladeLength ?? 5) * scale;
    const thickness = (obstacle.bladeWidth ?? 0.35) * scale;

    return (
      <g>
        <rect
          x={cx - length / 2}
          y={cy - thickness / 2}
          width={length}
          height={thickness}
          fill={color}
          stroke="#ffffff"
          strokeWidth="1"
        />

        <rect
          x={cx - thickness / 2}
          y={cy - length / 2}
          width={thickness}
          height={length}
          fill={color}
          stroke="#ffffff"
          strokeWidth="1"
        />

        <circle
          cx={cx}
          cy={cy}
          r="5"
          fill="#333333"
          stroke="#ffffff"
          strokeWidth="1"
        />
      </g>
    );
  }

  return null;
}

function MapSurface({ surface, project, scale }) {
  if (
    !isPoint3(surface.position) ||
    !Array.isArray(surface.size)
  ) {
    return null;
  }

  const [x, , z] = surface.position;
  const [width, depth] = surface.size;

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(depth)
  ) {
    return null;
  }

  const [cx, cy] = project(x, z);

  return (
    <rect
      x={cx - (width * scale) / 2}
      y={cy - (depth * scale) / 2}
      width={width * scale}
      height={depth * scale}
      fill={
        SURFACE_COLORS[surface.type] ?? "#d8c18b"
      }
      opacity="0.85"
      rx="2"
    />
  );
}

function MapRamp({ ramp, project, scale }) {
  if (
    !isPoint3(ramp.position) ||
    !Array.isArray(ramp.size)
  ) {
    return null;
  }

  const [x, , z] = ramp.position;
  const [width, , length] = ramp.size;

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(length)
  ) {
    return null;
  }

  const [cx, cy] = project(x, z);

  return (
    <g>
      <rect
        x={cx - (width * scale) / 2}
        y={cy - (length * scale) / 2}
        width={width * scale}
        height={length * scale}
        fill={ramp.color ?? "#328b50"}
        stroke="#ffffff"
        strokeDasharray="4 3"
        strokeWidth="1.5"
      />

      <line
        x1={cx - (width * scale) / 2}
        y1={cy}
        x2={cx + (width * scale) / 2}
        y2={cy}
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.6"
      />
    </g>
  );
}

export default function CourseMapRenderer({ course }) {
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

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;

  function project(x, z) {
    return [
      WIDTH / 2 + (x - centerX) * scale,
      HEIGHT / 2 + (z - centerZ) * scale,
    ];
  }

  const ballPosition = isPoint3(course.ballStart)
    ? course.ballStart
    : [0, 0, 0];

  const holePosition = isPoint3(course.hole?.position)
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
      <rect
        width={WIDTH}
        height={HEIGHT}
        fill="#152023"
        rx="14"
      />

      {(course.sections ?? [])
        .filter(
          (section) =>
            section.type === "floor" &&
            Array.isArray(section.points)
        )
        .map((section, index) => {
          const points = section.points
            .filter(isPoint2)
            .map(([x, z]) =>
              project(x, z).join(",")
            )
            .join(" ");

          if (!points) return null;

          return (
            <polygon
              key={section.id ?? index}
              points={points}
              fill={section.color ?? "#25834a"}
              stroke="#a67b52"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          );
        })}

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

      {(course.ramps ?? []).map(
        (ramp, index) => (
          <MapRamp
            key={ramp.id ?? index}
            ramp={ramp}
            project={project}
            scale={scale}
          />
        )
      )}

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

      <circle
        cx={holeX}
        cy={holeY}
        r={Math.max(
          4,
          (course.hole?.radius ?? 0.4) * scale
        )}
        fill="#111111"
        stroke="#eeeeee"
        strokeWidth="2"
      />

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
