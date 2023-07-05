import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState }                  from '../store';

import 'firebase/compat/auth';

interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  isSignedIn: boolean;
  currentUser: UserData | null;
  loadingAuthState: boolean; // new state variable
}

const initialState: AuthState = {
  isSignedIn: false,
  currentUser: null,
  loadingAuthState: true, 
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoadingAuthState: (state, action: PayloadAction<boolean>) => {
      state.loadingAuthState = action.payload;
    },
    setSignedIn: (state, action: PayloadAction<boolean>) => {
      state.isSignedIn = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<UserData | null>) => {
      state.currentUser = action.payload;
    }
  },
});

export const { setSignedIn, setCurrentUser, setLoadingAuthState } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
