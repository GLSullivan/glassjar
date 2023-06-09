import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ViewState {
  search  : string,
}

const initialState: ViewState = {
  search  : ""
}

export const search = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchString: (state, action: PayloadAction<string>) => {
      state.search = (action.payload)
    }
  },
})

export const { 
  setSearchString
} = search.actions

export default search.reducer