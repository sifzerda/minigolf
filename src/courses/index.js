// src/courses/index.js

const modules = import.meta.glob("./course[0-9][0-9].js",
  {
    eager: true,
    import: "default",
  }
);

export const courses = Object.keys(modules)
  .sort()
  .map((path) => modules[path]);

export const TOTAL_COURSES = courses.length;
export const TOTAL_PAR = courses.reduce((total, course) => total + course.par, 0);

export function getCourse(index) {
  return courses[index] ?? null;
}

export function getCourseCount() {
  return TOTAL_COURSES;
}

export function getTotalPar() {
  return TOTAL_PAR;
}
