import { createSlice, PayloadAction }             from '@reduxjs/toolkit';
import { formatISO, addYears, endOfMonth, addMonths, startOfMonth } from 'date-fns';
import { zonedTimeToUtc }                         from 'date-fns-tz';

export interface ActiveDates {
  today     : string;
  activeDate: string;
  farDate   : string;
}

const getUserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// Initialize with default values
const initialState: ActiveDates = {
  activeDate: formatISO(zonedTimeToUtc(new Date(), getUserTimeZone())),
  today: formatISO(zonedTimeToUtc(new Date(), getUserTimeZone())),
  farDate: formatISO(zonedTimeToUtc(addYears(new Date(), 2), getUserTimeZone())),
};

export const activeDates = createSlice({
  name: 'date',
  initialState,
  reducers: {
    setActiveDate: (state, action: PayloadAction<string>) => {
      state.activeDate = action.payload;
      state.farDate = formatISO(zonedTimeToUtc(addYears(new Date(action.payload), 2), getUserTimeZone()));
    }
  },
});

export const { setActiveDate } = activeDates.actions
export default activeDates.reducer
