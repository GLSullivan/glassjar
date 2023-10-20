import { configureStore }                         from '@reduxjs/toolkit';

import transactionsReducer, { setTransactions}    from './slices/transactions';
import activeDatesReducer                         from './slices/activedates';
import projectionsReducer                         from './slices/projections';
import userPrefsReducer, { setPrefsState }        from './slices/userprefs';
import userInfoReducer, { setUserInfo }           from './slices/userInfo';
import accountsReducer, { setAccounts }           from './slices/accounts';
import modalStateReducer, { openAccountForm }     from './slices/modals';
import loaderReducer                              from './slices/loader';
import { hideLoader, showLoader}                  from './slices/loader';
import searchReducer                              from './slices/search';
import viewReducer, { setViewState }              from './slices/views';
import authReducer, { setLoadingAuthState }       from './slices/auth';

import firebase                                   from 'firebase/compat/app';

import 'firebase/compat/firestore';
import 'firebase/compat/database';
import 'firebase/compat/auth';

import { createRRule } from '../utils/createRRule';
import { format, parseISO } from 'date-fns'

let isAppLoaded = false;

const firebaseConfig = {
  apiKey           : process.env.REACT_APP_API_KEY,
  authDomain       : process.env.REACT_APP_AUTH_DOMAIN,
  projectId        : process.env.REACT_APP_PROJECT_ID,
  storageBucket    : process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId            : process.env.REACT_APP_APP_ID,
  measurementId    : process.env.REACT_APP_MEASUREMENT_ID,
};

firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref();

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    store.dispatch(showLoader());
    const accountsPromise = dbRef.child('users/' + user.uid + '/accounts').once('value').then((snapshot) => {
      const accounts = snapshot.val() || [];
      store.dispatch(setAccounts(accounts));

      if (accounts.length < 1) { // Placeholder new user experience. 
        store.dispatch(openAccountForm());
      }

    });    

    const transactionsPromise = dbRef.child('users/' + user.uid + '/transactions').once('value').then((snapshot) => {
      const transactions = snapshot.val() || [];

      // Upgrade old transactions to new data structure if needed.
      
      transactions.forEach((transaction: any) => {
        if (transaction.date) {
          transaction.start_date = format(parseISO(transaction.date), 'yyyy-MM-dd');
        }
      
        if (!transaction.end_date && transaction.endDate) {
          transaction.end_date = format(parseISO(transaction.endDate), 'yyyy-MM-dd');
        }
      
        delete transaction.date;
        delete transaction.endDate;
        delete transaction.rruleSet;
        delete transaction.allowOverpayment;
      
        createRRule(transaction, (newRule) => {
          transaction.rrule = newRule;
        });
      });
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
        isAppLoaded = true;
        store.dispatch(setLoadingAuthState(false));
        store.dispatch(hideLoader());        
      })
      .catch((error) => {
        console.error(error);
      });

      store.dispatch(setUserInfo({ name: user.displayName, photo: user.photoURL }));
  } else {
    store.dispatch(hideLoader());
    store.dispatch(setLoadingAuthState(false));
    store.dispatch(setUserInfo({ name: null, photo: null }));
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
    userInfo    : userInfoReducer,
  }
});

export type RootState   = ReturnType<typeof store.getState>;
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
  const user  = firebase.auth().currentUser;
  if (user) {
    dbRef.child('users/' + user.uid + '/accounts').set(replaceUndefinedWithNull(state.accounts.accounts));
    dbRef.child('users/' + user.uid + '/transactions').set(replaceUndefinedWithNull(state.transactions.transactions));
    dbRef.child('users/' + user.uid + '/views').set(replaceUndefinedWithNull(state.views));
    dbRef.child('users/' + user.uid + '/prefs').set(replaceUndefinedWithNull(state.userPrefs));
  }
}

let prevState = {
  accounts    : store.getState().accounts,
  transactions: store.getState().transactions,
  views       : store.getState().views,
  userPrefs   : store.getState().userPrefs,
};

store.subscribe(() => {
  const user     = firebase.auth().currentUser;
  const newState = {
    accounts    : store.getState().accounts,
    transactions: store.getState().transactions,
    views       : store.getState().views,
    userPrefs   : store.getState().userPrefs,
  };
  
  if (user && isAppLoaded) {
    if (JSON.stringify(newState.accounts) !== JSON.stringify(prevState.accounts)
      || JSON.stringify(newState.transactions) !== JSON.stringify(prevState.transactions)
      || JSON.stringify(newState.views)        !== JSON.stringify(prevState.views)
      || JSON.stringify(newState.userPrefs)    !== JSON.stringify(prevState.userPrefs)) {

      saveStateToDatabase();
      prevState = newState;
    }
  }
});
