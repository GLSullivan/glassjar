import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ViewState {
  activeView  : string,
  calendarView: string,
  // Future views state goes here
}

const initialState: ViewState = {
  activeView  : "",
  calendarView: ""
}

export const views = createSlice({
  name: 'views',
  initialState,
  reducers: {
    setView: (state, action: PayloadAction<string>) => {
      state.activeView = (action.payload)
    },
    setCalendarView: (state, action: PayloadAction<string>) => {
      state.calendarView = (action.payload)
    }
  },
})

export const { 
  setView,
  setCalendarView
} = views.actions

export default views.reducer