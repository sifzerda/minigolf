// src/courses/layoutCourse.js

import { createCourse } from "./courseBuilder.js";
import {
    autoSizeTerrain,
    reportCourseIssues,
} from "./courseTools.js";
import {
    fairwayShape,
    terrainBrick,
    withGeography,
} from "./terrainBricks.js";

import {
    createCourseConstruction,
} from "./courseConstruction.js";

// --------------------------------------------------
// Utilities
// --------------------------------------------------

const asArray = (value) => {
    if (value == null) return [];

    return (Array.isArray(value) ? value : [value])
        .flat(Infinity)
        .filter((item) => item != null);
};

const isRoutePoint = (point) =>
    Array.isArray(point) &&
    point.length === 2 &&
    point.every(Number.isFinite);

function validateRoute(route) {
    if (
        !Array.isArray(route) ||
        route.length < 2 ||
        !route.every(isRoutePoint)
    ) {
        throw new Error(
            "Course route requires at least two [x,z] points"
        );
    }
}

const worldPosition = ([x, z]) => [x, 0, z];

function resolveObstacles(spec, build, course) {
    const result =
        typeof spec === "function"
            ? spec(build, course)
            : spec;

    return asArray(result);
}

// --------------------------------------------------
// Build an individual course
// --------------------------------------------------

export function createLayoutCourse({
    route,
    shape,
    width = 4,
    curved = true,
    shapeOptions = {},

    ballStart,
    hole,

    terrain = {},
    geography = {},
    fairway = null,

    surfaces = [],
    hazards = [],
    obstacles = [],
    sections = [],
    walls = [],

    // New
    autoTerrain = false,
    validate = false,

    ...metadata
} = {}) {
    const hasRoute = route != null;

    if (hasRoute) {
        validateRoute(route);
    }

    if (!shape && !hasRoute) {
        throw new Error(
            "A course needs a route or a custom shape"
        );
    }

    const startPosition = ballStart ?? (hasRoute ? worldPosition(route[0]) : null);
    const defaultHolePosition = hasRoute ? worldPosition(route.at(-1)) : null;
    const holePosition = hole?.position ?? defaultHolePosition;

    if (!startPosition || !holePosition) {
        throw new Error("A course needs a ball start and hole position");
    }

    // ----------------------------------------------
    // 1. Construct the playable course shape
    // ----------------------------------------------

    const courseShape =
        shape ??
        fairwayShape({
            ...shapeOptions,
            points: route,
            width,
            curved,
        });

    // ----------------------------------------------
    // 2. Build the base course
    // ----------------------------------------------

    const base = createCourse({
        ...metadata,

        shape: courseShape,
        terrain,

        ballStart: [...startPosition],

        hole: {
            radius: 0.43,
            ...hole,
            position: [...holePosition],
        },

        sections: asArray(sections),
        walls: asArray(walls),

        surfaces: [],
        obstacles: [],
    });

    // ----------------------------------------------
    // 3. Assemble natural geography
    // ----------------------------------------------

    const features = [
        ...asArray(geography.features),
    ];

    // Fairway levelling comes last so it can
    // smooth hills/ridges built earlier.
    if (fairway) {
        if (!hasRoute) {
            throw new Error(
                "Automatic fairway levelling requires a route"
            );
        }

        const settings =
            fairway === true ? {} : fairway;

        features.push(
            terrainBrick.fairway({
                points: route,
                width,
                ...settings,
            })
        );
    }

    const course = withGeography(base, {
        features,

        regions: asArray(geography.regions),

        surfaces: [
            ...asArray(geography.surfaces),
            ...asArray(surfaces),
            ...asArray(hazards),
        ],
    });

    // ----------------------------------------------
    // 4. Construct obstacles
    // ----------------------------------------------

    // We only prepare a terrain-construction
    // instance if obstacle creation needs it.
    const build =
        typeof obstacles === "function"
            ? createCourseConstruction(course.terrain)
            : null;

    const builtObstacles = resolveObstacles(
        obstacles,
        build,
        course
    );

    // ----------------------------------------------
    // 5. Return standard course data
    // ----------------------------------------------

    const finalCourse = {
        ...course,

        ...(hasRoute ? { route } : {}),

        obstacles: [
            ...(course.obstacles ?? []),
            ...builtObstacles,
        ],
    };

    // ----------------------------------------------
    // 6. Automatic terrain dimensions
    // ----------------------------------------------

    const sizedCourse = autoTerrain
        ? autoSizeTerrain(
            finalCourse,
            autoTerrain === true ? {} : autoTerrain
        )
        : finalCourse;

    // ----------------------------------------------
    // 7. Development validation
    // ----------------------------------------------

    if (validate) {
        reportCourseIssues(
            sizedCourse,
            validate === true ? {} : validate
        );
    }

    return sizedCourse;
}

// --------------------------------------------------
// Shared course templates
// --------------------------------------------------

function mergeObstacleSpecs(first, second) {
    if (
        typeof first === "function" ||
        typeof second === "function"
    ) {
        return (build, course) => [
            ...resolveObstacles(first, build, course),
            ...resolveObstacles(second, build, course),
        ];
    }

    return [
        ...asArray(first),
        ...asArray(second),
    ];
}

/**
 * Build multiple courses from shared defaults.
 *
 * Array-based features/objects are appended.
 * Scalar configuration values can be overridden.
 */
export function createLayoutTemplate(defaults = {}) {
    return (overrides = {}) =>
        createLayoutCourse({
            ...defaults,
            ...overrides,

            shapeOptions: {
                ...(defaults.shapeOptions ?? {}),
                ...(overrides.shapeOptions ?? {}),
            },

            terrain: {
                ...(defaults.terrain ?? {}),
                ...(overrides.terrain ?? {}),

                features: [
                    ...asArray(defaults.terrain?.features),
                    ...asArray(overrides.terrain?.features),
                ],

                regions: [
                    ...asArray(defaults.terrain?.regions),
                    ...asArray(overrides.terrain?.regions),
                ],
            },

            geography: {
                ...(defaults.geography ?? {}),
                ...(overrides.geography ?? {}),

                features: [
                    ...asArray(defaults.geography?.features),
                    ...asArray(overrides.geography?.features),
                ],

                regions: [
                    ...asArray(defaults.geography?.regions),
                    ...asArray(overrides.geography?.regions),
                ],

                surfaces: [
                    ...asArray(defaults.geography?.surfaces),
                    ...asArray(overrides.geography?.surfaces),
                ],
            },

            surfaces: [
                ...asArray(defaults.surfaces),
                ...asArray(overrides.surfaces),
            ],

            hazards: [
                ...asArray(defaults.hazards),
                ...asArray(overrides.hazards),
            ],

            sections: [
                ...asArray(defaults.sections),
                ...asArray(overrides.sections),
            ],

            walls: [
                ...asArray(defaults.walls),
                ...asArray(overrides.walls),
            ],

            obstacles: mergeObstacleSpecs(
                defaults.obstacles,
                overrides.obstacles
            ),
        });
}
