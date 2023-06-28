import { configureStore }                         from "@reduxjs/toolkit";

import transactionsReducer, { setTransactions}    from "./slices/transactions";
import activeDatesReducer                         from "./slices/activedates";
import projectionsReducer                         from "./slices/projections";
import userPrefsReducer, { setPrefsState }        from "./slices/userprefs";
import accountsReducer, { setAccounts }           from "./slices/accounts";
import modalStateReducer                          from "./slices/modals";
import loaderReducer                              from "./slices/loader";
import { hideLoader, showLoader}                  from "./slices/loader";
import searchReducer                              from "./slices/search";
import viewReducer, { setViewState }              from "./slices/views";
import authReducer                                from "./slices/auth";

import firebase                                   from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/database";
import "firebase/compat/auth";

let isAppLoaded = false;

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

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    store.dispatch(showLoader());
    const accountsPromise = dbRef.child('users/' + user.uid + '/accounts').once('value').then((snapshot) => {
      const accounts = snapshot.val() || [];
      store.dispatch(setAccounts(accounts));
    });    

    const transactionsPromise = dbRef.child('users/' + user.uid + '/transactions').once('value').then((snapshot) => {
      const transactions = snapshot.val() || [];
      store.dispatch(setTransactions(transactions));
    });

    const prefsPromise = dbRef.child('users/' + user.uid + '/prefs').once('value').then((snapshot) => {
      const prefs = snapshot.val();
      store.dispatch(setPrefsState(prefs));
    });

    const viewsPromise = dbRef.child('users/' + user.uid + '/views').once('value').then((snapshot) => {
      const views = snapshot.val();
      store.dispatch(setViewState(views));
    });

    Promise.all([accountsPromise, transactionsPromise, prefsPromise, viewsPromise])
      .then(() => {
        store.dispatch(hideLoader());
        isAppLoaded = true;
        
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    store.dispatch(hideLoader());
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
    search      : searchReducer,
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

let prevState = {
  accounts: store.getState().accounts,
  transactions: store.getState().transactions,
  views: store.getState().views,
  userPrefs: store.getState().userPrefs,
};

store.subscribe(() => {
  const user = firebase.auth().currentUser;
  const newState = {
    accounts: store.getState().accounts,
    transactions: store.getState().transactions,
    views: store.getState().views,
    userPrefs: store.getState().userPrefs,
  };
  
  if (user && isAppLoaded) {
    // Check if any of the state properties have changed
    if (JSON.stringify(newState.accounts) !== JSON.stringify(prevState.accounts)
      || JSON.stringify(newState.transactions) !== JSON.stringify(prevState.transactions)
      || JSON.stringify(newState.views) !== JSON.stringify(prevState.views)
      || JSON.stringify(newState.userPrefs) !== JSON.stringify(prevState.userPrefs)) {

      saveStateToDatabase();
      prevState = newState;
    }
  }
});
