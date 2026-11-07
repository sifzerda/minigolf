// // src/renderers/CourseMapRenderer.jsx

import { useMemo } from "react";

const WIDTH = 320;
const HEIGHT = 440;
const PADDING = 30;

function getBounds(course) {
  const points = course.sections
    .filter((section) => section.type === "floor")
    .flatMap((section) => section.points ?? []);

  if (!points.length) {
    return {
      minX: -4,
      maxX: 4,
      minZ: -10,
      maxZ: 10,
    };
  }

  const xs = points.map((p) => p[0]);
  const zs = points.map((p) => p[1]);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

function MapObstacle({ obstacle, project, scale }) {
  const [x, , z] = obstacle.position;
  const [cx, cy] = project(x, z);

  const color = obstacle.color ?? "#ffcc33";

  if (obstacle.type === "bumper") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={(obstacle.radius ?? 0.4) * scale}
        fill={color}
        stroke="#ffffff"
        strokeWidth="1.5"
      />
    );
  }

  if (
    obstacle.type === "block" ||
    obstacle.type === "movingBarrier"
  ) {
    const [width, , depth] = obstacle.size;

    const distance =
      obstacle.type === "movingBarrier"
        ? obstacle.distance ?? 0
        : 0;

    const isMoving = obstacle.type === "movingBarrier";

    return (
      <g>
        {isMoving && (
          <line
            x1={
              cx -
              (obstacle.axis === "z" ? 0 : distance * scale)
            }
            y1={
              cy -
              (obstacle.axis === "z" ? distance * scale : 0)
            }
            x2={
              cx +
              (obstacle.axis === "z" ? 0 : distance * scale)
            }
            y2={
              cy +
              (obstacle.axis === "z" ? distance * scale : 0)
            }
            stroke={color}
            strokeWidth="2"
            strokeDasharray="5 5"
            opacity="0.65"
          />
        )}

        <rect
          x={cx - (width * scale) / 2}
          y={cy - (depth * scale) / 2}
          width={width * scale}
          height={depth * scale}
          rx="2"
          fill={color}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </g>
    );
  }

  if (obstacle.type === "windmill") {
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
  const [x, , z] = surface.position;
  const [cx, cy] = project(x, z);

  const [width, depth] = surface.size;

  const colors = {
    sand: "#d8c18b",
    ice: "#8cdef0",
    concrete: "#999999",
  };

  return (
    <rect
      x={cx - (width * scale) / 2}
      y={cy - (depth * scale) / 2}
      width={width * scale}
      height={depth * scale}
      fill={colors[surface.type] ?? "#d8c18b"}
      opacity="0.85"
      rx="2"
    />
  );
}

function MapRamp({ ramp, project, scale }) {
  const [x, , z] = ramp.position;
  const [cx, cy] = project(x, z);

  const [width, , length] = ramp.size;

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

  const [ballX, ballY] = project(
    course.ballStart[0],
    course.ballStart[2]
  );

  const [holeX, holeY] = project(
    course.hole.position[0],
    course.hole.position[2]
  );

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="course-preview-map"
      role="img"
      aria-label={`Map of ${course.name}`}
    >
      <rect
        width={WIDTH}
        height={HEIGHT}
        fill="#152023"
        rx="14"
      />

      {course.sections
        .filter((section) => section.type === "floor")
        .map((section) => (
          <polygon
            key={section.id}
            points={section.points
              .map(([x, z]) => project(x, z).join(","))
              .join(" ")}
            fill={section.color ?? "#25834a"}
            stroke="#a67b52"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        ))}

      {(course.surfaces ?? []).map((surface, index) => (
        <MapSurface
          key={surface.id ?? index}
          surface={surface}
          project={project}
          scale={scale}
        />
      ))}

      {(course.ramps ?? []).map((ramp, index) => (
        <MapRamp
          key={ramp.id ?? index}
          ramp={ramp}
          project={project}
          scale={scale}
        />
      ))}

      {(course.obstacles ?? []).map((obstacle, index) => (
        <MapObstacle
          key={obstacle.id ?? index}
          obstacle={obstacle}
          project={project}
          scale={scale}
        />
      ))}

      <circle
        cx={holeX}
        cy={holeY}
        r={Math.max(4, course.hole.radius * scale)}
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
