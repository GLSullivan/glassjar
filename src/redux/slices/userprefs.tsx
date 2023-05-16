import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserPrefsState {
  healthRangeTop: number;
  healthRangeBottom: number;
}

const initialState: UserPrefsState = {
  healthRangeTop: 1000000,
  healthRangeBottom: 0,
};

export const userPrefsSlice = createSlice({
  name: 'userPrefs',
  initialState,
  reducers: {
    setHealthRangeTop: (state, action: PayloadAction<number>) => {
      state.healthRangeTop = action.payload;
    },
    setHealthRangeBottom: (state, action: PayloadAction<number>) => {
      state.healthRangeBottom = action.payload;
    },
  },
});

export const { setHealthRangeTop, setHealthRangeBottom } = userPrefsSlice.actions;

export default userPrefsSlice.reducer;
