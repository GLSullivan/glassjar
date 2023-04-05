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
  console.log('Started as', dateString);

  const date = new Date(dateString + 'T00:00:00'); // Appending 'T00:00:00' to create a Date object in the local timezone
  const timezoneOffset = -date.getTimezoneOffset();
  console.log('timezoneOffset', timezoneOffset);

  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  const padNumber = (num: number) => (num < 10 ? '0' : '') + num;

  const hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);
  const minutesOffset = Math.abs(timezoneOffset) % 60;

  const dateWithOffset = new Date(date.getTime() + (hoursOffset)); // Adding the timezone offset
  console.log('dateWithOffset', dateWithOffset,dateWithOffset.toISOString());

  const theoutput = (
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

  console.log('became', theoutput);
  return theoutput;
}