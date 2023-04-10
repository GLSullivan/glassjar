export function getEnumValues(obj: { [key: string]: any }): string[] {
  return Object.values(obj) as string[];
}
