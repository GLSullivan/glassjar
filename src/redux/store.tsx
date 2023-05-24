import { configureStore }                   from "@reduxjs/toolkit";

import firebase                             from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

import transactions                         from "./slices/transactions";
import activeDates                          from "./slices/activedates";
import projectionsReducer                   from "./slices/projections";
import userPrefsReducer, { UserPrefsState } from "./slices/userprefs";
import accounts                             from "./slices/accounts";
import modalState                           from "./slices/modals";
import loaderReducer                        from "./slices/loader";
import viewReducer, { ViewState }           from "./slices/views";
import auth                                 from "./slices/auth";

import { Transaction }                      from "../models/Transaction";
import { Account }                          from "../models/Account";

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

// Validate Transactions
function validateTransaction(transaction: Transaction): Transaction | null {
  const defaultTransaction: Transaction = {
    transactionName : "Default Transaction",
    id              : new Date().getTime(),
    type            : "deposit",
    amount          : 0,
    date            : new Date().toISOString(),
    description     : "No description provided",
    isRecurring     : false,
    allowOverpayment: false,
    showInCalendar  : false,
  };

  // Validation: Check if both toAccount and fromAccount are missing.
  if (!transaction.toAccount && !transaction.fromAccount) {
    return null;
  }

  // If transaction type is deposit or transfer and toAccount does not exist in savedAccounts
  if (
    (transaction.type === "deposit" || transaction.type === "transfer") &&
    (!savedAccounts ||
      !savedAccounts.some((account) => account.id === transaction.toAccount))
  ) {
    // If savedAccounts exists and has at least one account, set toAccount to the ID of the account at the 0 position
    if (savedAccounts && savedAccounts.length > 0) {
      transaction.toAccount = savedAccounts[0].id;
    }
  }

  // If transaction type is withdrawal and fromAccount does not exist in savedAccounts
  if (
    (transaction.type === "withdrawal" || transaction.type === "transfer") &&
    (!savedAccounts ||
      !savedAccounts.some((account) => account.id === transaction.fromAccount))
  ) {
    // If savedAccounts exists and has at least one account, set fromAccount to the ID of the account at the 0 position
    if (savedAccounts && savedAccounts.length > 0) {
      transaction.fromAccount = savedAccounts[0].id;
    }
  }

  return { ...defaultTransaction, ...transaction };
}

// Validate Accounts
function validateAccount(account: Account): Account | null {
  const defaultAccount: Account = {
    name          : "Default Account",
    id            : new Date().getTime().toString(),   // TODO: Account and transaction should use the same type for id.
    currentBalance: 0,
    type          : "checking",
    isLiability   : false,
    lastUpdated   : new Date().toISOString(),
    showInGraph   : true,
    color         : 0,
  };

  return { ...defaultAccount, ...account };
}

// Check if states are in local storage and validate them
const savedAccountsRaw: Account[] | null = localStorage.getItem("accounts")
  ? JSON.parse(localStorage.getItem("accounts") as string)
  : null;

let savedAccounts: Account[] | null;

if (savedAccountsRaw) {
  savedAccounts = savedAccountsRaw
    .map((account: Account) => validateAccount(account))
    // Filter out invalid transactions
    .filter((account: Account | null): account is Account => account !== null);
} else {
  savedAccounts = null;
}

const savedTransactionsRaw: Transaction[] | null = localStorage.getItem(
  "transactions"
)
  ? JSON.parse(localStorage.getItem("transactions") as string)
  : null;

let savedTransactions: Transaction[] | null;

if (savedTransactionsRaw) {
  savedTransactions = savedTransactionsRaw
    .map((transaction: Transaction) => validateTransaction(transaction))
    // Filter out invalid transactions
    .filter(
      (transaction: Transaction | null): transaction is Transaction =>
        transaction !== null
    );
} else {
  savedTransactions = null;
}

let savedViews: ViewState | null = localStorage.getItem("views")
  ? JSON.parse(localStorage.getItem("views") as string)
  : null;

let savedPrefsRaw = localStorage.getItem("prefs");

let savedPrefs: UserPrefsState | null;
if (savedPrefsRaw === "undefined") {
  savedPrefs = null;
} else {
  savedPrefs = savedPrefsRaw ? JSON.parse(savedPrefsRaw as string) : null;
}

// Preloaded state for transactions and accounts slices
const preloadedState = {
  accounts: {
    accounts: savedAccounts || [],
    activeAccount: null,
  },
  transactions: {
    transactions: savedTransactions || [],
    activeTransaction: null,
  },
  views: savedViews || {
    activeView: "calendar",
    calendarView: "Month",
  },
  userPrefs: savedPrefs || {
    healthRangeTop: 1000000,
    healthRangeBottom: 0,
  },
};

// console.log(firebase);

export const store = configureStore({
  reducer: {
    loader      : loaderReducer,
    activeDates : activeDates,
    modalState  : modalState,
    transactions: transactions,
    accounts    : accounts,
    projections : projectionsReducer,
    views       : viewReducer,
    userPrefs   : userPrefsReducer,
    auth        : auth,
  },
  preloadedState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function saveStateToLocalStorage() {
  const state = store.getState();
  localStorage.setItem("accounts", JSON.stringify(state.accounts.accounts));
  localStorage.setItem(
    "transactions",
    JSON.stringify(state.transactions.transactions)
  );
  localStorage.setItem("views", JSON.stringify(state.views));
  localStorage.setItem("prefs", JSON.stringify(state.userPrefs));
}

store.subscribe(() => {
  saveStateToLocalStorage();
});
