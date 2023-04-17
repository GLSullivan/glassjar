export function getEnumValues(obj: { [key: string]: any }): string[] {
  return Object.values(obj) as string[];
}

export function getDateWithOrdinal(date: Date) {
  const s = ['th', 'st', 'nd', 'rd'];
  const day = date.getDate();
  const v = day % 100;
  const ordinal = s[(v - 20) % 10] || s[v] || s[0];
  
  const dateString = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  }).replace(/\d+/, `${day}`);

  return { dateString, ordinal };
}
