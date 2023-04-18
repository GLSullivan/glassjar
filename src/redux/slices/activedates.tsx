import { createSlice }          from '@reduxjs/toolkit'
import type { PayloadAction }   from '@reduxjs/toolkit'

export interface ActiveDate {
  today     : string;
  nearDate  : string;
  activeDate: string;
  farDate   : string
  graphNearDate: string;
  graphFarDate   : string
}

const initialState: ActiveDate = {
  today        : (new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  nearDate     : (new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  activeDate   : (new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  graphNearDate: (new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  graphFarDate : ((new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0)).toISOString()),
  farDate      : ((new Date(new Date().getFullYear() + 1, new Date().getMonth(), 0)).toISOString())
}

// const activeDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 10);

export const activeDate = createSlice({
  name: 'activeDate',
  initialState,
  reducers: {
    setNearDate: (state, action: PayloadAction<string>) => {
      state.nearDate = action.payload
    },   
    setActiveDate: (state, action: PayloadAction<string>) => {
      state.activeDate = action.payload
    },    
    setFarDate: (state, action: PayloadAction<string>) => {
      state.farDate = action.payload
    },
  },
})

export const { setActiveDate, setFarDate } = activeDate.actions
export default activeDate.reducer