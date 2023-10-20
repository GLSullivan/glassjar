// export const localDateValue = (isoDate: string) => {
//   const [datePart, timePart] = isoDate.split('T');
//   const [year, month, day] = datePart.split('-').map((part) => parseInt(part, 10));
//   const [hour, minute] = timePart.split(':').map((part) => parseInt(part, 10));

//   const date = new Date(Date.UTC(year, month - 1, day, hour, minute));

//   return date.toLocaleDateString(undefined, {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//   });
// };

// export const stripTime = (isoDate: string): string => {
//   const date = new Date(isoDate);
//   const year = date.getUTCFullYear();
//   const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
//   const day = date.getUTCDate().toString().padStart(2, '0');
//   return `${year}-${month}-${day}`;
// };

// export function addZoneOffset(dateString: string): string {

//   const date = new Date(dateString + 'T00:00:00'); // Appending 'T00:00:00' to create a Date object in the local timezone
//   const timezoneOffset = -date.getTimezoneOffset();

//   const padNumber = (num: number) => (num < 10 ? '0' : '') + num;

//   const hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);

//   const dateWithOffset = new Date(date.getTime() + (hoursOffset)); // Adding the timezone offset

//   const theOutput = (
//     dateWithOffset.getUTCFullYear() +
//     '-' +
//     padNumber(dateWithOffset.getUTCMonth() + 1) +
//     '-' +
//     padNumber(dateWithOffset.getUTCDate()) +
//     'T' +
//     padNumber(dateWithOffset.getUTCHours()) +
//     ':' +
//     padNumber(dateWithOffset.getUTCMinutes()) +
//     ':' +
//     padNumber(dateWithOffset.getUTCSeconds()) +
//     '.000Z'
//   );

//   return theOutput;
// }

// export function conformDate(date: string) {
//   const [year, month, day] = date.split('-').map((value) => parseInt(value, 10));
//   return new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0];
// }






/**
 * Takes a date string or a Date object and returns a Date object in local time.
 * Supports date strings in the format YYYY-MM-DD, MM/DD/YYYY, and Date objects.
 * Throws an error for unsupported formats.
 * 
 * @param {string|Date} input - The date string or Date object.
 * @returns {Date} - The Date object in local time.
 */
export function createDateInLocalTimeZone(input: string | Date): Date {
  // If the input is already a Date object.
  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }

  // For YYYY-MM-DD format.
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // For MM/DD/YYYY format.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [month, day, year] = input.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  // Add more formats if needed...

  // If none of the above formats match, throw an error.
  throw new Error(`Unsupported date format: ${input}`);
}
