import { createSlice }          from '@reduxjs/toolkit'
import type { PayloadAction }   from '@reduxjs/toolkit'

import { conformDate }          from './../../utils/dateUtils'

export interface ActiveDate {
  today        : string;
  nearDate     : string;
  activeDate   : string;
  farDate      : string;
  graphNearDate: string;
  graphFarDate : string;
  graphSpan    : number;
}

const getInitialDate = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const graphFarDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 3, 0)).toISOString().split('T')[0];
  const farDate = new Date(Date.UTC(now.getFullYear() + 1, now.getMonth() + 6, 0)).toISOString().split('T')[0];
  const graphSpan = 6; // Make this a user setting.

  return {
    today,
    nearDate: today,
    activeDate: today,
    graphNearDate: today,
    graphFarDate,
    farDate,
    graphSpan, // Should probably move to a user settings file. 
  };
};

const initialState: ActiveDate = getInitialDate();

const updateGraphFarDate = (state: ActiveDate) => {
  const graphNearDate = new Date(state.graphNearDate);
  const newGraphFarDate = new Date(graphNearDate.getFullYear(), graphNearDate.getMonth() + state.graphSpan, 0).toISOString();
  
  if (new Date(newGraphFarDate) > new Date(state.farDate)) {
    state.farDate = newGraphFarDate;
  }
  
  state.graphFarDate = newGraphFarDate;
};

export const activeDate = createSlice({
  name: 'activeDate',
  initialState,
  reducers: {
    setNearDate: (state, action: PayloadAction<string>) => {
      state.nearDate = conformDate(action.payload);

      const nearDate            = new Date(conformDate(action.payload));
      const firstOfMonth        = new Date(nearDate.getFullYear(), nearDate.getMonth(), 1).toISOString();
            state.graphNearDate = firstOfMonth >= state.today ? firstOfMonth : state.today;

      const graphNearDate       = new Date(state.graphNearDate);
            state.graphFarDate  = new Date(graphNearDate.getFullYear(), graphNearDate.getMonth() + state.graphSpan, 0).toISOString();
      if (new Date(new Date(state.graphFarDate).getFullYear(), new Date(state.graphFarDate).getMonth() + 3, 0) > new Date(state.farDate)) {
        state.farDate = new Date(graphNearDate.getFullYear(), graphNearDate.getMonth() + 3 + state.graphSpan, 0).toISOString();
      }
    },
    setActiveDate: (state, action: PayloadAction<string>) => {
      console.log(action.payload)
      state.activeDate = conformDate(action.payload)
      console.log(state.activeDate)
    },    
    setFarDate: (state, action: PayloadAction<string>) => {
      state.farDate = conformDate(action.payload)
    },
    setGraphSpan: (state, action: PayloadAction<number>) => {
      state.graphSpan = action.payload;
      updateGraphFarDate(state);
    },
  },
})

export const { setActiveDate, setFarDate, setNearDate, setGraphSpan } = activeDate.actions
export default activeDate.reducer
