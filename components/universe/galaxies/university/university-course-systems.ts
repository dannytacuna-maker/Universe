import type { CourseSystemDefinition } from "./course-system-definition";

export const universityCourseSystems = [
  {
    displayName: "Logistics & Distribution",
    id: "logistics",
    name: "Logistics and Distribution",
    palette: {
      core: "#f3fbff",
      halo: "#78c8ff",
      orbit: "#79aeea",
    },
    schedule: [
      {
        day: "monday",
        endTime: "18:30",
        group: "M41",
        room: "E133",
        startTime: "16:30",
      },
      {
        day: "wednesday",
        endTime: "18:30",
        group: "M41",
        room: "E121",
        startTime: "16:30",
      },
    ],
    sourceName: "Distribución Logística",
    status: "active",
  },
  {
    displayName: "Business Ethics",
    id: "business-ethics",
    name: "International Business Ethics",
    palette: {
      core: "#edf6ff",
      halo: "#9895d8",
      orbit: "#7778aa",
    },
    schedule: [
      {
        day: "monday",
        endTime: "20:30",
        group: "M41",
        room: "E123",
        startTime: "18:30",
      },
      {
        day: "tuesday",
        endTime: "20:30",
        group: "M41",
        room: "E125",
        startTime: "18:30",
      },
    ],
    sourceName: "Ética en los Negocios Internacionales",
    status: "active",
  },
  {
    displayName: "Language A III",
    id: "language-a-iii",
    name: "Language A III",
    palette: {
      core: "#eefeff",
      halo: "#64bac8",
      orbit: "#548a96",
    },
    schedule: [
      {
        day: "tuesday",
        endTime: "16:30",
        group: "M33",
        room: "A381",
        startTime: "14:30",
      },
      {
        day: "friday",
        endTime: "16:30",
        group: "M33",
        room: "E032",
        startTime: "14:30",
      },
    ],
    sourceName: "Idioma A III",
    status: "active",
  },
  {
    displayName: "Human Resources",
    id: "human-resources-management",
    name: "Human Resources Management",
    palette: {
      core: "#f5f6ff",
      halo: "#8d9ec3",
      orbit: "#6c7892",
    },
    schedule: [
      {
        day: "thursday",
        endTime: "16:30",
        group: "M32",
        room: "E128",
        startTime: "14:30",
      },
      {
        day: "friday",
        endTime: "16:30",
        group: "M32",
        room: "C223",
        startTime: "12:30",
      },
    ],
    sourceName: "Gestión de Recursos Humanos",
    status: "active",
  },
  {
    displayName: "Mergers & Acquisitions",
    id: "mergers-acquisitions",
    name: "Mergers and Acquisitions",
    palette: {
      core: "#fff6ef",
      halo: "#e09a6c",
      orbit: "#b87558",
    },
    schedule: [
      {
        day: "tuesday",
        endTime: "18:30",
        group: "M41",
        room: "E135",
        startTime: "16:30",
      },
      {
        day: "thursday",
        endTime: "20:30",
        group: "M41",
        room: "E114",
        startTime: "18:30",
      },
    ],
    sourceName: "Fusiones y Adquisiciones",
    status: "active",
  },
  {
    displayName: "Emerging Markets",
    id: "emerging-markets",
    name: "Emerging Powers and Markets",
    palette: {
      core: "#f0fff6",
      halo: "#6dcaa0",
      orbit: "#4e9a78",
    },
    schedule: [
      {
        day: "wednesday",
        endTime: "16:30",
        group: "M41",
        room: "E132",
        startTime: "14:30",
      },
      {
        day: "friday",
        endTime: "18:30",
        group: "M41",
        room: "E121",
        startTime: "16:30",
      },
    ],
    sourceName: "Potencias y Mercados Emergentes",
    status: "active",
  },
  {
    displayName: "Final Project",
    id: "final-project",
    name: "Final Project",
    palette: {
      core: "#fff9ea",
      halo: "#d6b56f",
      orbit: "#9f8351",
    },
    schedule: [],
    sourceName: "Final Project",
    status: "active",
  },
] as const satisfies readonly CourseSystemDefinition[];

export const logisticsCourseSystem = universityCourseSystems[0];
