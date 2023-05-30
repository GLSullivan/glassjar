export const localDateValue = (isoDate: string) => {
  const [datePart, timePart] = isoDate.split('T');
  const [year, month, day] = datePart.split('-').map((part) => parseInt(part, 10));
  const [hour, minute] = timePart.split(':').map((part) => parseInt(part, 10));

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const stripTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function addZoneOffset(dateString: string): string {

  const date = new Date(dateString + 'T00:00:00'); // Appending 'T00:00:00' to create a Date object in the local timezone
  const timezoneOffset = -date.getTimezoneOffset();

  const padNumber = (num: number) => (num < 10 ? '0' : '') + num;

  const hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);

  const dateWithOffset = new Date(date.getTime() + (hoursOffset)); // Adding the timezone offset

  const theOutput = (
    dateWithOffset.getUTCFullYear() +
    '-' +
    padNumber(dateWithOffset.getUTCMonth() + 1) +
    '-' +
    padNumber(dateWithOffset.getUTCDate()) +
    'T' +
    padNumber(dateWithOffset.getUTCHours()) +
    ':' +
    padNumber(dateWithOffset.getUTCMinutes()) +
    ':' +
    padNumber(dateWithOffset.getUTCSeconds()) +
    '.000Z'
  );

  return theOutput;
}

export function conformDate(date: string) {
  const [year, month, day] = date.split('-').map((value) => parseInt(value, 10));
  return new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0];
}
