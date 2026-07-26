const madridDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Madrid",
  year: "numeric",
});

const madridDeadlineFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "Europe/Madrid",
});

export function formatUniversityDate(value: string) {
  return madridDateFormatter.format(new Date(`${value}T12:00:00Z`));
}

export function formatUniversityDeadline(value: string) {
  return madridDeadlineFormatter.format(new Date(value));
}

export function describeDeadlineDistance(
  daysFromNow: number,
  isOverdue: boolean,
) {
  if (daysFromNow === 0) {
    return isOverdue ? "Overdue today" : "Due today";
  }

  if (daysFromNow === 1) {
    return "Due tomorrow";
  }

  if (daysFromNow === -1) {
    return "1 day overdue";
  }

  return daysFromNow > 0
    ? `Due in ${daysFromNow} days`
    : `${Math.abs(daysFromNow)} days overdue`;
}

export function getUniversityDateInputValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Madrid",
    year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function toDateTimeInputValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
