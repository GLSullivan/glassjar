import { configureStore }                   from "@reduxjs/toolkit";

import firebase                             from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/database";

import transactionsReducer, { setTransactions}    from "./slices/transactions";
import activeDatesReducer                         from "./slices/activedates";
import projectionsReducer                         from "./slices/projections";
import userPrefsReducer, { UserPrefsState }       from "./slices/userprefs";
import accountsReducer, { setAccounts }           from "./slices/accounts";
import modalStateReducer                          from "./slices/modals";
import loaderReducer                              from "./slices/loader";
import viewReducer, { setViewState }              from "./slices/views";
import authReducer                                from "./slices/auth";

let isAppLoaded = 0;

const firebaseConfig = {
  apiKey           : "AIzaSyAlTL5Q1AGIK1bsKz0eWd7d5jwoyNIlLE0",
  authDomain       : "glassjar-jarstore.firebaseapp.com",
  projectId        : "glassjar-jarstore",
  storageBucket    : "glassjar-jarstore.appspot.com",
  messagingSenderId: "485993136920",
  appId            : "1:485993136920:web:cf2c6312a276293ca2946d",
  measurementId    : "G-MWSVVY6GTK",
};

firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref();
const user = firebase.auth().currentUser;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // After the last data dispatch to the Redux store, set the app to be fully loaded
    dbRef.child('users/' + user.uid + '/accounts').on('value', (snapshot) => {
      const accounts = snapshot.val() || [];
      store.dispatch(setAccounts(accounts));
      console.log("accounts loaded?")
      isAppLoaded ++;
    });    
    dbRef.child('users/' + user.uid + '/transactions').on('value', (snapshot) => {
      const transactions = snapshot.val() || [];
      store.dispatch(setTransactions(transactions));
      console.log("transactions loaded?")
      isAppLoaded ++;
    });
    dbRef.child('users/' + user.uid + '/prefs').on('value', (snapshot) => {
      // Handle the dispatch of user prefs here

      // At this point, the app is fully loaded.
      console.log("prefs loaded?")
      isAppLoaded ++;
    });
    dbRef.child('users/' + user.uid + '/views').on('value', (snapshot) => {
      const views = snapshot.val();
      store.dispatch(setViewState(views));
      console.log("views loaded?")
      isAppLoaded ++;
    });
  } else {
    // No user is signed in. Here you can add logic when the user is signed out, e.g., clean the store.
  }
});

export const store = configureStore({
  reducer: {
    accounts    : accountsReducer,
    activeDates : activeDatesReducer,
    auth        : authReducer,
    loader      : loaderReducer,
    modalState  : modalStateReducer,
    projections : projectionsReducer,
    transactions: transactionsReducer,
    userPrefs   : userPrefsReducer,
    views       : viewReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


function replaceUndefinedWithNull(value: any): any {

  if (value === undefined) {
    return null;
  } else if (typeof value === 'object' && value !== null) {
    for (let key in value) {
      try {
        value[key] = replaceUndefinedWithNull(value[key]);
      } catch (error) {
      }
    }
  }
  return value;
}

function saveStateToDatabase() {
  const state = store.getState();
  const user = firebase.auth().currentUser;
  if (user) {
    dbRef.child("users/" + user.uid + "/accounts").set(replaceUndefinedWithNull(state.accounts.accounts));
    dbRef.child("users/" + user.uid + "/transactions").set(replaceUndefinedWithNull(state.transactions.transactions));
    dbRef.child("users/" + user.uid + "/views").set(replaceUndefinedWithNull(state.views));
    dbRef.child("users/" + user.uid + "/prefs").set(replaceUndefinedWithNull(state.userPrefs));
  }
}

store.subscribe(() => {
  const user = firebase.auth().currentUser;
  if (user && isAppLoaded >= 3) {  // Check if the app is fully loaded before saving state to database
    console.log("Saving!")
    saveStateToDatabase();
  }
});