import type {
  UniversityAssignment,
  UniversityGrade,
  UniversityNote,
} from "./university-record";

const seededAt = "2026-10-30T15:45:00.000Z";

/**
 * Snapshot from campus.europaeducationgroup.es (Canvas) on 2026-10-30.
 * Stable IDs keep re-imports from duplicating rows.
 */
export const canvasSeedAssignments = [
  {
    id: "canvas-hr-performance-observation",
    courseId: "human-resources-management",
    title: "Performance Observation",
    details:
      "Canvas undated assignment in Gestión de Recursos Humanos. Still open.",
    dueAt: "2026-12-15T22:59:00.000Z",
    status: "planned",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-hr-google-employee-relations",
    courseId: "human-resources-management",
    title:
      "Out of Classroom: Employee Relations at Google — Balancing Innovation and Employee Voice",
    details:
      "Discussive case study. Canvas due Fri 30 Oct 2026 23:59 local. Submission recorded in Canvas.",
    dueAt: "2026-10-30T22:59:59.000Z",
    status: "submitted",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-hr-guest-experts-note",
    courseId: "human-resources-management",
    title: "International Guest Experts Note (Aula E232)",
    details: "Guest expert session note. Due Wed 28 Oct 2026. Submitted in Canvas.",
    dueAt: "2026-10-28T22:59:59.000Z",
    status: "submitted",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-hr-case-study-5-google-talent",
    courseId: "human-resources-management",
    title: "Case study 5: Secret to Google's Talent Retention",
    details: "Due 22 Oct 2026. Submitted in Canvas; still flagged in Canvas To-Do.",
    dueAt: "2026-10-22T21:59:59.000Z",
    status: "submitted",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-hr-case-study-4-mercadona",
    courseId: "human-resources-management",
    title: "Case Study 4: Mercadona Case Study",
    details: "Due 16 Oct 2026. Submitted in Canvas.",
    dueAt: "2026-10-16T12:00:00.000Z",
    status: "complete",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-logistics-kahoot-2",
    courseId: "logistics",
    title: "Kahoot 2",
    details: "Distribución Logística. Due 19 Oct 2026. Still unsubmitted in Canvas.",
    dueAt: "2026-10-19T16:00:00.000Z",
    status: "planned",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-logistics-kahoot-3",
    courseId: "logistics",
    title: "Kahoot 3",
    details: "Distribución Logística. Due 22 Oct 2026. Still unsubmitted in Canvas.",
    dueAt: "2026-10-22T16:00:00.000Z",
    status: "planned",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-logistics-kahoot-1",
    courseId: "logistics",
    title: "Kahoot 1",
    details: "Distribución Logística. Graded in Canvas (8.4 / 10).",
    dueAt: "2026-10-15T16:00:00.000Z",
    status: "complete",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-logistics-fe-03",
    courseId: "logistics",
    title: "Fe-03 — English for Logistics 3",
    details: "Distribución Logística. Submitted and graded in Canvas (~8.67 / 10).",
    dueAt: "2026-10-22T16:00:00.000Z",
    status: "complete",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-mergers-assignment-one",
    courseId: "mergers-acquisitions",
    title: "Assignment One",
    details: "Fusiones y Adquisiciones. Submitted in Canvas.",
    dueAt: "2026-09-20T21:59:59.000Z",
    status: "complete",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
] as const satisfies readonly UniversityAssignment[];

export const canvasSeedGrades = [
  {
    id: "canvas-grade-logistics-current",
    courseId: "logistics",
    label: "Canvas current score",
    score: 85.33,
    maximumScore: 100,
    occurredOn: "2026-10-30",
    weightPercent: null,
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-grade-mergers-current",
    courseId: "mergers-acquisitions",
    label: "Canvas current score",
    score: 55,
    maximumScore: 100,
    occurredOn: "2026-10-30",
    weightPercent: null,
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-grade-logistics-kahoot-1",
    courseId: "logistics",
    label: "Kahoot 1",
    score: 8.4,
    maximumScore: 10,
    occurredOn: "2026-10-15",
    weightPercent: null,
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-grade-logistics-fe-03",
    courseId: "logistics",
    label: "Fe-03 — English for Logistics 3",
    score: 8.67,
    maximumScore: 10,
    occurredOn: "2026-10-22",
    weightPercent: null,
    createdAt: seededAt,
    updatedAt: seededAt,
  },
] as const satisfies readonly UniversityGrade[];

export const canvasSeedNotes = [
  {
    id: "canvas-note-idioma-evaluation",
    courseId: "language-a-iii",
    kind: "note",
    content:
      "Canvas (Idioma C II): Procedimiento y fechas para la evaluación de IDIOMA AIII/CII — posted 30 Oct 2026. Check course announcements for exam/assessment windows.",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-note-idioma-tuesday-class",
    courseId: "language-a-iii",
    kind: "note",
    content:
      "Canvas: “Para la clase del martes” announcement posted 30 Oct 2026 — prep before Tuesday Idioma session.",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-note-hr-nyt",
    courseId: "human-resources-management",
    kind: "note",
    content:
      "Canvas HR: New York Times article announcement posted 29 Oct 2026 — review for class discussion.",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "canvas-note-practicas-boletin",
    courseId: "external-internship-i",
    kind: "note",
    content:
      "Canvas Prácticas: Boletín de oferta de prácticas posted 28 Oct 2026 (Externas I & II).",
    createdAt: seededAt,
    updatedAt: seededAt,
  },
] as const satisfies readonly UniversityNote[];
