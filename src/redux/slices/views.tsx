import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ViewState {
  activeView  : string,
  calendarView: string,
  // Future views state goes here
}

const initialState: ViewState = {
  activeView  : "calendar",
  calendarView: "month"
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
    },
    setViewState: (state, action: PayloadAction<ViewState>) => {
      if (action.payload) {
        return action.payload;
      }    
    }
  },
})

export const { 
  setView,
  setCalendarView,
  setViewState
} = views.actions

export default views.reducer