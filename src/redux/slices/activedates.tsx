import { createSlice }          from '@reduxjs/toolkit'
import type { PayloadAction }   from '@reduxjs/toolkit'

export interface ActiveDate {
  activeDate: string;
  farDate: string
}

const initialState: ActiveDate = {
  activeDate: (new Date().toISOString()),
  farDate: ((new Date(new Date().getFullYear() + 1, new Date().getMonth(), 0)).toISOString())
}

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