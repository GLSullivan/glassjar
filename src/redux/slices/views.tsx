import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ViewState {
  activeView  : string,
  calendarView: string,
  graphRange  : number,
}

const initialState: ViewState = {
  activeView  : 'calendar',
  calendarView: 'month',
  graphRange  : 3 // TODO: Make this a value saved with the view. 
}

const rangeChoices: number[] = [1,3,6,12];

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
    setGraphRange: (state, action: PayloadAction<number>) => {
      state.graphRange = (action.payload)
    },
    setViewState: (state, action: PayloadAction<ViewState>) => {
      if (action.payload) {
        return action.payload;
      }    
    },
    increaseGraphRange: (state) => {
      const currentIndex = rangeChoices.indexOf(state.graphRange);
      let nextIndex;

      if (currentIndex === -1 || currentIndex === rangeChoices.length - 1) {
        nextIndex = currentIndex; 
      } else {
        nextIndex = currentIndex + 1;
      }

      state.graphRange = rangeChoices[nextIndex];
    },
    plusGraphRange: (state) => {
      const currentIndex = rangeChoices.indexOf(state.graphRange);
      let nextIndex;

      if (currentIndex === -1 || currentIndex === rangeChoices.length - 1) {
        nextIndex = 0; 
      } else {
        nextIndex = currentIndex + 1;
      }

      state.graphRange = rangeChoices[nextIndex];
    },
    decreaseGraphRange: (state) => { // TODO: When prettying up the header nav, consider plus/minus to the range? 
      const currentIndex = rangeChoices.indexOf(state.graphRange);
      let nextIndex;

      if (currentIndex <= 0) {
        nextIndex = currentIndex; 
      } else {
        nextIndex = currentIndex - 1;
      }

      state.graphRange = rangeChoices[nextIndex];
    },
    minusGraphRange: (state) => {
      const currentIndex = rangeChoices.indexOf(state.graphRange);
      let nextIndex;

      if (currentIndex <= 0) {
        nextIndex = rangeChoices.length - 1; 
      } else {
        nextIndex = currentIndex - 1;
      }

      state.graphRange = rangeChoices[nextIndex];
    }
  },
})

export const { 
  setView,
  setCalendarView,
  setViewState,
  setGraphRange,
  increaseGraphRange, 
  plusGraphRange,     
  decreaseGraphRange, 
  minusGraphRange     
} = views.actions

export default views.reducer