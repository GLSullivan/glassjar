// slices/userInfo.js
import { createSlice } from '@reduxjs/toolkit';

export const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState: {
    name: null,
    photo: null,
  },
  reducers: {
    setUserInfo: (state, action) => {
      state.name = action.payload.name;
      state.photo = action.payload.photo;
    },
  },
});

export const { setUserInfo } = userInfoSlice.actions;

export default userInfoSlice.reducer;
