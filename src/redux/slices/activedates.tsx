import { createSlice }          from '@reduxjs/toolkit'
import type { PayloadAction }   from '@reduxjs/toolkit'

export interface ActiveDate {
  today: string;
  activeDate: string;
  farDate: string
}

const initialState: ActiveDate = {
  today:      (new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 10)),
  activeDate: (new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 10)),
  farDate:    ((new Date(new Date().getFullYear() + 1, new Date().getMonth(), 0)).toISOString().slice(0, 10) + 'T00:00:00.000Z')
}

// const activeDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 10);

export const activeDate = createSlice({
  name: 'activeDate',
  initialState,
  reducers: {
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