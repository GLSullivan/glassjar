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
  apiKey           : import.meta.env.VITE_API_KEY             || 'AIzaSyBfL7YupxiVmLYpsKoFdbT5_6edB-kUVr8',
  authDomain       : import.meta.env.VITE_AUTH_DOMAIN         || 'glassjar-jarstore.firebaseapp.com',
  databaseURL      : import.meta.env.VITE_DATABASE_URL        || 'https://glassjar-jarstore-default-rtdb.firebaseio.com',
  projectId        : import.meta.env.VITE_PROJECT_ID          || 'glassjar-jarstore',
  storageBucket    : import.meta.env.VITE_STORAGE_BUCKET      || 'glassjar-jarstore.appspot.com',
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || '485993136920',
  appId            : import.meta.env.VITE_APP_ID              || '1:485993136920:web:cf2c6312a276293ca2946d',
  measurementId    : import.meta.env.VITE_MEASUREMENT_ID      || 'G-MWSVVY6GTK',
};

firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref();

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    store.dispatch(showLoader());
    const accountsPromise = dbRef.child('users/' + user.uid + '/accounts').once('value').then((snapshot) => {
      const accounts = snapshot.val() || [];

      // Idempotent migration: older clients stored interestRate as the raw
      // <input> string; the model (and the interest math) wants a number.
      accounts.forEach((account: any) => {
        if (account && account.interestRate !== undefined && account.interestRate !== null) {
          const parsed = Number(account.interestRate);
          account.interestRate = isNaN(parsed) ? null : parsed;
        }
      });

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

// Dev safety valve: VITE_DISABLE_SYNC=true (e.g. in .env.development.local)
// runs the app against live data without ever writing back to Firebase.
const syncDisabled = import.meta.env.VITE_DISABLE_SYNC === 'true';

const SAVE_DEBOUNCE_MS = 1000;

// Only the slices below are persisted. Changes are detected by reference
// (Redux Toolkit state is immutable, so !== is exact and free — the old
// JSON.stringify comparison serialized the whole state on every action), and
// only the slices that actually changed are written, in one debounced
// update() per burst. A multi-path update() can't wipe sibling slices the
// way four whole-slice set() calls could.
let dirty = { accounts: false, transactions: false, views: false, prefs: false };
let pendingSave: ReturnType<typeof setTimeout> | null = null;

let prevPersisted = {
  accounts    : store.getState().accounts.accounts,
  transactions: store.getState().transactions.transactions,
  views       : store.getState().views,
  userPrefs   : store.getState().userPrefs,
};

function savePendingToDatabase() {
  pendingSave = null;
  const user = firebase.auth().currentUser;
  if (!user) return;
  if (syncDisabled) {
    console.warn('Glassjar: Firebase sync DISABLED (REACT_APP_DISABLE_SYNC) — changes are NOT being saved.');
    dirty = { accounts: false, transactions: false, views: false, prefs: false };
    return;
  }

  const state = store.getState();
  const update: { [path: string]: any } = {};
  if (dirty.accounts)     update['accounts']     = replaceUndefinedWithNull(state.accounts.accounts);
  if (dirty.transactions) update['transactions'] = replaceUndefinedWithNull(state.transactions.transactions);
  if (dirty.views)        update['views']        = replaceUndefinedWithNull(state.views);
  if (dirty.prefs)        update['prefs']        = replaceUndefinedWithNull(state.userPrefs);
  dirty = { accounts: false, transactions: false, views: false, prefs: false };

  if (Object.keys(update).length > 0) {
    dbRef.child('users/' + user.uid).update(update).catch((error) => {
      console.error('Glassjar: saving to Firebase failed', error);
    });
  }
}

function scheduleSave() {
  if (pendingSave) clearTimeout(pendingSave);
  pendingSave = setTimeout(savePendingToDatabase, SAVE_DEBOUNCE_MS);
}

// Don't lose the tail of the debounce window on tab close.
window.addEventListener('beforeunload', () => {
  if (pendingSave) savePendingToDatabase();
});

store.subscribe(() => {
  if (!isAppLoaded || !firebase.auth().currentUser) return;

  const state = store.getState();
  let changed = false;

  if (state.accounts.accounts !== prevPersisted.accounts) {
    dirty.accounts = true;
    prevPersisted.accounts = state.accounts.accounts;
    changed = true;
  }
  if (state.transactions.transactions !== prevPersisted.transactions) {
    dirty.transactions = true;
    prevPersisted.transactions = state.transactions.transactions;
    changed = true;
  }
  if (state.views !== prevPersisted.views) {
    dirty.views = true;
    prevPersisted.views = state.views;
    changed = true;
  }
  if (state.userPrefs !== prevPersisted.userPrefs) {
    dirty.prefs = true;
    prevPersisted.userPrefs = state.userPrefs;
    changed = true;
  }

  if (changed) scheduleSave();
});
