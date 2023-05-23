import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import firebase from 'firebase/compat/app';
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
}

const initialState: AuthState = {
  isSignedIn: false,
  currentUser: null
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSignedIn: (state, action: PayloadAction<boolean>) => {
      state.isSignedIn = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<UserData | null>) => {
      state.currentUser = action.payload;
      console.log("???",action.payload)
    }
  },
});

export const { setSignedIn, setCurrentUser } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
