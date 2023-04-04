import { createSlice }          from '@reduxjs/toolkit'
import type { PayloadAction }   from '@reduxjs/toolkit'

export interface ActiveDate {
  activeDate: string
}

const initialState: ActiveDate = {
  activeDate: (new Date().toISOString())
}

export const activeDate = createSlice({
  name: 'activeDate',
  initialState,
  reducers: {
    setActiveDate: (state, action: PayloadAction<string>) => {
      state.activeDate = action.payload
    },
  },
})

export const { setActiveDate } = activeDate.actions

export default activeDate.reducer