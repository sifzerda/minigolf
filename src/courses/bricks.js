// src/courses/bricks


const ORIGIN = [0, 0, 0];

// --------------------------------------------------
// Basic building bricks
// --------------------------------------------------

export const brick = {
    box(size, position = ORIGIN, options = {}) {
        return {
            shape: "box",
            size,
            position,
            ...options,
        };
    },

    pyramid(size, position = ORIGIN, options = {}) {
        return {
            shape: "pyramid",
            size,
            position,
            ...options,
        };
    },

    wedge(size, position = ORIGIN, options = {}) {
        return {
            shape: "wedge",
            size,
            position,
            ...options,
        };
    },

    sphere(radius, position = ORIGIN, options = {}) {
        return {
            shape: "sphere",
            radius,
            position,
            ...options,
        };
    },

    cylinder(radius, height, position = ORIGIN, options = {}) {
        return {
            shape: "cylinder",
            radius,
            height,
            position,
            ...options,
        };
    },

    ramp(
        size = [2, 0.5, 2],
        position = [0, 0, 0],
        options = {}
    ) {
        return {
            shape: "ramp",

            size,
            position,

            rotation: [0, 0, 0],
            segments: 32,

            color: "#b8a58a",
            surface: "concrete",

            ...options,
        };
    },

    boxWithHoles(
        size = [2, 2, 2],
        position = [0, 0, 0],
        options = {}
    ) {
        return {
            shape: "boxWithHoles",
            size,
            position,
            rotation: [0, 0, 0],
            holes: [],
            segments: 32,
            color: "#82796b",
            ...options,
        };
    },
};



// --------------------------------------------------
// Assembly helpers
// --------------------------------------------------

export function assembly({
    parts = [],
    position = ORIGIN,
    rotation = ORIGIN,
    ...options
} = {}) {
    return {
        ...options,
        type: "assembly",
        position,
        rotation,
        parts: parts.flat(Infinity),
    };
}

export function repeat(count, factory) {
    return Array.from(
        { length: count },
        (_, index) => factory(index)
    );
}

// Convenience functions for course definitions.
// Preserve original obstacle types for compatibility.

export const bridge = (options = {}) => ({
    ...options,
    type: "bridge",
});

export const tunnel = (options = {}) => ({
    ...options,
    type: "tunnel",
});

export const elevatedPath = (options = {}) => ({
    ...options,
    type: "elevatedPath",
});



// --------------------------------------------------
// Shared box used by existing obstacle recipes
// --------------------------------------------------

function box(id, size, position, color, rotation = ORIGIN) {
    return brick.box(size, position, {
        id,
        rotation,
        color,
        roughness: 0.8,
        metalness: 0.05,
    });
}

// --------------------------------------------------
// Access ramps
// --------------------------------------------------

// Matches the original bridge/elevated-path
// box-based ramp construction.

function accessRamps({
    width,
    thickness,
    length,
    centerY,
    groundY,
    rampLength,
    rampThickness,
    color,
}) {
    if (rampLength <= 0) return [];

    const topY = centerY + thickness / 2;
    const rise = topY - groundY;

    if (rise <= 0.001) return [];

    const angle = Math.atan2(rise, rampLength);
    const slopedLength = Math.hypot(rampLength, rise);

    const localY =
        (groundY + topY) / 2 -
        centerY -
        (rampThickness / 2) * Math.cos(angle);

    const centerZ = (length + rampLength) / 2;

    return [-1, 1].map((side) =>
        box(
            `approach-${side}`,
            [width, rampThickness, slopedLength],
            [0, localY, side * centerZ],
            color,
            [side * angle, 0, 0]
        )
    );
}

// --------------------------------------------------
// Tunnel recipe
// --------------------------------------------------

function buildTunnel(entity) {
    const [width, height, length] =
        entity.size ?? [2, 1.5, 5];

    const thickness = Math.max(
        0.04,
        Math.min(
            entity.thickness ?? 0.15,
            width / 4,
            height / 4
        )
    );

    const color = entity.color ?? "#586b76";

    const parts = [
        box(
            "roof",
            [width, thickness, length],
            [0, height / 2 - thickness / 2, 0],
            color
        ),

        box(
            "left",
            [thickness, height, length],
            [-width / 2 + thickness / 2, 0, 0],
            color
        ),

        box(
            "right",
            [thickness, height, length],
            [width / 2 - thickness / 2, 0, 0],
            color
        ),
    ];

    if (entity.floor === true) {
        parts.push(
            box(
                "floor",
                [width, thickness, length],
                [0, -height / 2 + thickness / 2, 0],
                entity.floorColor ?? color
            )
        );
    }

    return parts;
}

// --------------------------------------------------
// Bridge recipe
// --------------------------------------------------

function buildBridge(entity) {
    const [width, thickness, length] =
        entity.size ?? [3, 0.25, 6];

    const color = entity.color ?? "#80664c";
    const railColor = entity.railColor ?? "#4a3829";

    const parts = [
        box(
            "deck",
            [width, thickness, length],
            ORIGIN,
            color
        ),
    ];

    if (entity.rails !== false) {
        const railHeight = entity.railHeight ?? 0.5;

        const railThickness = Math.min(
            entity.railThickness ?? 0.12,
            width / 4
        );

        const railY = thickness / 2 + railHeight / 2;
        const railX = width / 2 - railThickness / 2;

        for (const side of [-1, 1]) {
            parts.push(
                box(
                    `rail-${side}`,
                    [railThickness, railHeight, length],
                    [side * railX, railY, 0],
                    railColor
                )
            );
        }
    }

    if (entity.ramps === true) {
        parts.push(
            ...accessRamps({
                width: entity.rampWidth ?? width,
                thickness,
                length,
                centerY: (entity.position ?? ORIGIN)[1],
                groundY: entity.groundY ?? 0,
                rampLength: entity.rampLength ?? 3,
                rampThickness: entity.rampThickness ?? 0.2,
                color: entity.rampColor ?? color,
            })
        );
    }

    return parts;
}

// --------------------------------------------------
// Elevated-path recipe
// --------------------------------------------------

function buildElevatedPath(entity) {
    const [width, thickness, length] =
        entity.size ?? [2, 0.2, 8];

    const color = entity.color ?? "#6b7c86";

    const parts = [
        box(
            "walkway",
            [width, thickness, length],
            ORIGIN,
            color
        ),
    ];

    if (entity.supports !== false) {
        const supportHeight = Math.max(
            0,
            entity.supportHeight ?? 1.5
        );

        const supportWidth = Math.min(
            width * 0.3,
            entity.supportWidth ?? 0.3
        );

        if (supportHeight > 0) {
            const y =
                -thickness / 2 - supportHeight / 2;

            const z = length / 2 - supportWidth;

            for (const side of [-1, 1]) {
                parts.push(
                    box(
                        `support-${side}`,
                        [
                            supportWidth,
                            supportHeight,
                            supportWidth,
                        ],
                        [0, y, side * z],
                        color
                    )
                );
            }
        }
    }

    if (entity.rails === true) {
        const railHeight = entity.railHeight ?? 0.5;

        const railThickness = Math.min(
            entity.railThickness ?? 0.12,
            width / 4
        );

        for (const side of [-1, 1]) {
            parts.push(
                box(
                    `rail-${side}`,
                    [railThickness, railHeight, length],
                    [
                        side * (width / 2 - railThickness / 2),
                        thickness / 2 + railHeight / 2,
                        0,
                    ],
                    entity.railColor ?? color
                )
            );
        }
    }

    if (entity.ramps === true) {
        parts.push(
            ...accessRamps({
                width: entity.rampWidth ?? width,
                thickness,
                length,
                centerY: (entity.position ?? ORIGIN)[1],
                groundY: entity.groundY ?? 0,
                rampLength: entity.rampLength ?? 3,
                rampThickness: entity.rampThickness ?? 0.2,
                color: entity.rampColor ?? color,
            })
        );
    }

    return parts;
}

// --------------------------------------------------
// Static obstacle registry
// --------------------------------------------------

const STATIC_BUILDERS = {
    bridge: buildBridge,
    tunnel: buildTunnel,
    elevatedPath: buildElevatedPath,
};

// Converts an existing obstacle into a reusable
// assembly for rendering.
//
// The original ECS entity remains unchanged.

export function buildStaticAssembly(entity) {
    if (entity.type === "assembly") {
        return entity;
    }

    const build = STATIC_BUILDERS[entity.type];

    if (!build) {
        throw new Error(
            `Unsupported static assembly: ${entity.type}`
        );
    }

    return {
        ...entity,
        type: "assembly",
        friction:
            entity.friction ??
            (entity.type === "tunnel" ? 0.7 : 0.8),
        parts: entity.parts ?? build(entity),
    };
}
