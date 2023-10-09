import { createSlice, PayloadAction }                                     from '@reduxjs/toolkit';
import { formatISO, addYears, isAfter, parseISO, startOfDay }             from 'date-fns';
import { zonedTimeToUtc }                                                 from 'date-fns-tz';

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
      state.activeDate = formatISO(startOfDay(parseISO(action.payload)));
      const newFarDate = zonedTimeToUtc(addYears(startOfDay(parseISO(action.payload)), 1), getUserTimeZone());

      if (isAfter(newFarDate, parseISO(state.farDate))) {
        state.farDate = formatISO(newFarDate);
      }    
    }
  },
});

export const { setActiveDate } = activeDates.actions
export default activeDates.reducer
