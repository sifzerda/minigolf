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

function getFloorPolygons(section) {
  if (section.type !== "floor") return [];

  // MultiPolygon -> Polygon -> Ring -> [x, z]
  if (Array.isArray(section.polygons)) {
    return section.polygons.filter(
      (polygon) =>
        Array.isArray(polygon) &&
        polygon.some(
          (ring) =>
            Array.isArray(ring) &&
            ring.filter(isPoint2).length >= 3
        )
    );
  }

  // Legacy floor format.
  if (
    Array.isArray(section.points) &&
    section.points.filter(isPoint2).length >= 3
  ) {
    return [[section.points]];
  }

  return [];
}

function polygonPoints(points, project) {
  return (points ?? [])
    .filter(isPoint2)
    .map(([x, z]) => project(x, z).join(","))
    .join(" ");
}

function ringToPath(ring, project) {
  const points = (ring ?? []).filter(isPoint2);

  if (points.length < 3) return "";

  return (
    points
      .map(([x, z], index) => {
        const [px, py] = project(x, z);

        return `${index === 0 ? "M" : "L"} ${px} ${py}`;
      })
      .join(" ") + " Z"
  );
}

function polygonToPath(polygon, project) {
  return (polygon ?? [])
    .map((ring) => ringToPath(ring, project))
    .filter(Boolean)
    .join(" ");
}

function getBounds(course) {
  const points = [];

  function addPoint(point) {
    if (isPoint2(point)) {
      points.push(point);
    }
  }

  function addPosition(position) {
    if (isPoint3(position)) {
      addPoint([position[0], position[2]]);
    }
  }

  function addRotatedRectangle(position, width, length, angle = 0) {
    if (
      !isPoint3(position) ||
      !Number.isFinite(width) ||
      !Number.isFinite(length)
    ) {
      return;
    }

    const [cx, , cz] = position;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    for (const x of [-width / 2, width / 2]) {
      for (const z of [-length / 2, length / 2]) {
        addPoint([
          cx + x * c + z * s,
          cz - x * s + z * c,
        ]);
      }
    }
  }

  for (const section of course.sections ?? []) {
    if (section.type === "floor") {
      for (const polygon of getFloorPolygons(section)) {
        for (const ring of polygon) {
          for (const point of ring) {
            addPoint(point);
          }
        }
      }
    } else {
      const size = section.size ?? [
        section.width ?? 1,
        section.height ?? 0.2,
        section.length ?? 1,
      ];

      addRotatedRectangle(
        section.position ?? [0, section.y ?? 0, 0],
        size[0],
        size[2],
        section.rotation?.[1] ?? 0
      );
    }
  }

  for (const ring of course.boundaryRings ?? []) {
    for (const point of ring) {
      addPoint(point);
    }
  }

  for (const surface of course.surfaces ?? []) {
    if (Array.isArray(surface.points)) {
      for (const point of surface.points) {
        addPoint(point);
      }
    } else if (surface.size) {
      addRotatedRectangle(
        surface.position,
        surface.size[0],
        surface.size[1]
      );
    }
  }

  for (const ramp of course.ramps ?? []) {
    if (ramp.size) {
      addRotatedRectangle(
        ramp.position,
        ramp.size[0],
        ramp.size[2],
        ramp.angle ?? 0
      );
    }
  }

  for (const wall of course.walls ?? []) {
    const size = wall.size ?? [
      wall.length ?? 1,
      wall.height ?? 0.8,
      wall.thickness ?? 0.2,
    ];

    addRotatedRectangle(
      wall.position,
      size[0],
      size[2],
      wall.rotation?.[1] ?? 0
    );
  }

  for (const obstacle of course.obstacles ?? []) {
    addPosition(obstacle.position);
    addPoint(obstacle.start);
    addPoint(obstacle.end);

    if (obstacle.size) {
      addRotatedRectangle(
        obstacle.position,
        obstacle.size[0],
        obstacle.size[2],
        obstacle.angle ??
        obstacle.rotation?.[1] ??
        0
      );
    }

    if (
      obstacle.type === "bumper" ||
      obstacle.type === "plateau"
    ) {
      const radius = obstacle.radius ?? 0.4;
      const p = obstacle.position;

      if (isPoint3(p)) {
        addPoint([p[0] - radius, p[2] - radius]);
        addPoint([p[0] + radius, p[2] + radius]);
      } else if (isPoint2(p)) {
        addPoint([p[0] - radius, p[1] - radius]);
        addPoint([p[0] + radius, p[1] + radius]);
      }
    }
  }

  addPosition(course.ballStart);
  addPosition(course.hole?.position);

  if (!points.length) {
    return {
      minX: -4,
      maxX: 4,
      minZ: -10,
      maxZ: 10,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const [x, z] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }

  return { minX, maxX, minZ, maxZ };
}

function getSurfaceColor(surface) {
  const type = surface.surface ?? surface.type;

  return (
    surface.color ??
    SURFACE_COLORS[type] ??
    SURFACE_COLORS.grass
  );
}

function MapFloor({ section, project }) {
  const polygons = getFloorPolygons(section);

  if (!polygons.length) return null;

  return (
    <g>
      {polygons.map((polygon, index) => {
        const path = polygonToPath(polygon, project);

        if (!path) return null;

        return (
          <path
            key={index}
            d={path}
            fill={section.color ?? "#328b50"}
            fillRule="evenodd"
            stroke="#a67b52"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}

function MapSurface({ surface, project, scale }) {
  const color = getSurfaceColor(surface);
  const type = surface.surface ?? surface.type;

  const stroke =
    type === "water" ? "#7bd8f5" : "#ffffff";


  if (
    Array.isArray(surface.points) &&
    surface.points.filter(isPoint2).length >= 3
  ) {
    const rings = [
      surface.points,
      ...(surface.holes ?? []).map((hole) =>
        Array.isArray(hole) ? hole : hole.points
      ),
    ];

    const path = rings
      .map((ring) => ringToPath(ring, project))
      .filter(Boolean)
      .join(" ");

    return (
      <path
        d={path}
        fill={color}
        fillRule="evenodd"
        stroke={stroke}
        strokeWidth={type === "water" ? 1.8 : 1}
        strokeLinejoin="round"
        opacity={type === "water" ? 0.95 : 0.9}
      />
    );
  }


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
      x={cx - (width * scale) / 2}
      y={cy - (length * scale) / 2}
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

  const angle = ramp.angle ?? 0;
  const rotation = (angle * 180) / Math.PI;

  return (
    <g
      transform={`translate(${cx} ${cy}) rotate(${-rotation})`}
    >
      <rect
        x={-w / 2}
        y={-l / 2}
        width={w}
        height={l}
        fill={ramp.color ?? "#b8a58a"}
        stroke="#f1e0b6"
        strokeWidth="1.5"
      />

      <rect
        x={-w / 2}
        y={-l / 2}
        width={w}
        height={l}
        fill={`url(#${gradientId})`}
      />

      <line
        x1={-w / 2}
        y1={-l / 2}
        x2={w / 2}
        y2={-l / 2}
        stroke="#fff0c9"
        strokeWidth="2.5"
      />

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
    !Array.isArray(size) ||
    !Number.isFinite(size[0]) ||
    !Number.isFinite(size[2])
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
      transform={`translate(${cx} ${cy}) rotate(${-(angle * 180) / Math.PI
        })`}
    />
  );
}

function MapObstacle({
  obstacle,
  project,
  scale,
}) {
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
    const p = isPoint3(position)
      ? [position[0], position[2]]
      : position;

    if (!isPoint2(p)) return null;

    const [cx, cy] = project(p[0], p[1]);

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

  if (type === "bridge") {
    if (
      !Array.isArray(size) ||
      !Number.isFinite(size[0]) ||
      !Number.isFinite(size[2])
    ) {
      return null;
    }

    const width = size[0] * scale;
    const length = size[2] * scale;

    const plankCount = Math.max(
      1,
      Math.floor(size[2] / 0.35)
    );

    const angle =
      obstacle.angle ??
      obstacle.rotation?.[1] ??
      0;

    return (
      <g
        transform={`translate(${cx} ${cy}) rotate(${-(angle * 180) / Math.PI
          })`}
      >
        {/* Bridge deck */}
        <rect
          x={-width / 2}
          y={-length / 2}
          width={width}
          height={length}
          rx="1"
          fill={obstacle.color ?? "#a87945"}
          stroke="#654526"
          strokeWidth="1.2"
        />

        {/* Wooden planks */}
        {Array.from({ length: plankCount }, (_, index) => {
          const y =
            -length / 2 +
            ((index + 1) * length) / (plankCount + 1);

          return (
            <line
              key={index}
              x1={-width / 2}
              y1={y}
              x2={width / 2}
              y2={y}
              stroke="#654526"
              strokeWidth="0.8"
              opacity="0.65"
            />
          );
        })}

        {/* Side edges */}
        <line
          x1={-width / 2}
          y1={-length / 2}
          x2={-width / 2}
          y2={length / 2}
          stroke="#d5a76e"
          strokeWidth="1"
        />

        <line
          x1={width / 2}
          y1={-length / 2}
          x2={width / 2}
          y2={length / 2}
          stroke="#d5a76e"
          strokeWidth="1"
        />
      </g>
    );
  }

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

    const angle =
      obstacle.angle ??
      obstacle.rotation?.[1] ??
      0;

    return (
      <g
        transform={`translate(${cx} ${cy}) rotate(${-(angle * 180) / Math.PI
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

function MapBoundary({
  rings,
  project,
  style = {},
  scale,
}) {
  if (!Array.isArray(rings)) return null;

  const color = style.color ?? "#795548";

  return (
    <g
      fill="none"
      stroke={color}
      strokeWidth={Math.max(
        2,
        (style.thickness ?? 0.25) * scale
      )}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {rings.map((ring, index) => {
        const path = ringToPath(ring, project);

        if (!path) return null;

        return <path key={index} d={path} />;
      })}
    </g>
  );
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
    () => getBounds(course ?? {}),
    [course]
  );

  if (!course) return null;

  const boundsWidth = Math.max(
    0.001,
    bounds.maxX - bounds.minX
  );

  const boundsHeight = Math.max(
    0.001,
    bounds.maxZ - bounds.minZ
  );

  const scale = Math.min(
    (WIDTH - PADDING * 2) / boundsWidth,
    (HEIGHT - PADDING * 2) / boundsHeight
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

      {/* Playable floor */}
      {(course.sections ?? [])
        .filter(
          (section) => section.type === "floor"
        )
        .map((section, index) => (
          <MapFloor
            key={section.id ?? index}
            section={section}
            project={project}
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

      {/* Ramps */}
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

      {/* Obstacles */}
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

      {/* Perimeter boundary walls */}
      <MapBoundary
        rings={course.boundaryRings}
        project={project}
        style={course.wallStyle ?? {}}
        scale={scale}
      />

      {/* Individual course walls */}
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
      {isPoint3(course.ballStart) && (
        <circle
          cx={ballX}
          cy={ballY}
          r="5"
          fill="#ffffff"
          stroke="#222222"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
