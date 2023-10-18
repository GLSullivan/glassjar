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

import { RRule, RRuleSet, Frequency, Options } from 'rrule';
import { CustomIntervalType, RecurrenceFrequency } from '../utils/constants';

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

      // Upgrade old transactions to new data structure if needed. // TODO: Take all of this out after the transition.
      transactions.map((transaction: any) => {
        if ('id' in transaction && typeof transaction.id === 'number') {
          transaction.event_id = transaction.id.toString();
          delete transaction.id; // Remove the old id field
        }        
        
        if ('allowOverpayment' in transaction) {
          delete transaction.allowOverpayment; 
        }
      
        // Check if 'date' exists
        if ('date' in transaction) {
          transaction.start_date = new Date(transaction.date).toString();
          // delete transaction.date; // TODO: Once the transition to rrule is complete, delete the old fields. 
        }
      
        // Check if 'endDate' exists and 'ends' is true
        if ('endDate' in transaction && 'ends' in transaction && transaction.ends === true) {
          transaction.end_date = new Date(transaction.endDate).toString();
          //delete transaction.endDate; // TODO: Once the transition to rrule is complete, delete the old fields. 
        }

        if ('start_date' in transaction && transaction.start_date instanceof Date) {
          transaction.start_date = new Date(transaction.start_date).toString();
        }
        
        if ('end_date' in transaction && transaction.end_date instanceof Date) {
          transaction.end_date = new Date(transaction.end_date).toString();
        }

        if (!transaction.start_date) {
          return null;
        }
      
        let dtstartDate = new Date(transaction.start_date);
        let dtendDate = transaction.end_date ? new Date(transaction.end_date) : undefined;
        
        let options: Options = {
          dtstart: dtstartDate,
          until: dtendDate,
        } as Options;
      
        const rruleSet = new RRuleSet();
        let rruleString: string | null = null;
      
        if (transaction.recurrenceFrequency && transaction.isRecurring) {
          switch (transaction.recurrenceFrequency) {
            case RecurrenceFrequency.DAILY:
              options.freq = RRule.DAILY;
              break;
            case RecurrenceFrequency.WEEKLY:
              options.freq = RRule.WEEKLY;
              break;
            case RecurrenceFrequency.MONTHLY:
              options.freq = RRule.MONTHLY;
              break;
            case RecurrenceFrequency.YEARLY:
              options.freq = RRule.YEARLY;
              break;
            case RecurrenceFrequency.GIVEN_DAYS:
              options.freq = RRule.WEEKLY;
              options.byweekday = transaction.givenDays || undefined;
              break;
            case RecurrenceFrequency.TWICE_MONTHLY:
              options.freq = RRule.MONTHLY;
              const initialDate = dtstartDate.getDate();
              if (initialDate <= 14) {
                options.bymonthday = [initialDate, initialDate + 14];
              } else {
                options.bymonthday = [initialDate, initialDate - 14];
              }
              break;
            case RecurrenceFrequency.CUSTOM:
              options.interval=  transaction.recurrenceInterval;
              switch (transaction.customIntervalType) {
                case CustomIntervalType.DAY:
                  options.freq = RRule.DAILY;
                  break;
                case CustomIntervalType.WEEK:
                  options.freq = RRule.WEEKLY;
                  break;
                case CustomIntervalType.MONTH:
                  options.freq = RRule.MONTHLY;
                  break;
                case CustomIntervalType.YEAR:
                  options.freq = RRule.YEARLY;
                  break;
                default:
                  return null;
                }
              break;
            case RecurrenceFrequency.ARBITRARY:
              if (transaction.arbitraryDates) {
                rruleSet.rdate(new Date(transaction.start_date));
                transaction.arbitraryDates.forEach((date: string) => {
                  rruleSet.rdate(new Date(date));
                });
              }
              break;
            default:
              return null;
          } 
          
          // If end_date exists, include it in the RRULE options
          if (dtendDate) {
            options.until = dtendDate;
          }
      
          if (transaction.recurrenceFrequency !== RecurrenceFrequency.ARBITRARY) {
            const rrule = new RRule(options);
            rruleString = rrule.toString();
            rruleSet.rrule(rrule);
          }
        }
      
        // Serialize to JSON-compatible structure
        const serializedSet = {
          rrule: rruleString,
          rdates: rruleSet.rdates().map(date => date.toISOString()),
        };
      
        transaction.rrule = JSON.stringify(serializedSet);
        // console.log(">>> ",transaction.transactionName,transaction.rrule,transaction)
        return transaction;
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
