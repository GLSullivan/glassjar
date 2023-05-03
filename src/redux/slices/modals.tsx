import { createSlice }          from '@reduxjs/toolkit'

export interface ModalState {
  transactionFormOpen: boolean,
  accountFormOpen: boolean,
  accountListOpen: boolean,
  transactionHelperOpen: boolean,
}

const initialState: ModalState = {
  transactionFormOpen  : false,
  accountFormOpen      : false,
  accountListOpen      : false,
  transactionHelperOpen: false,
}

export const modalState = createSlice({
  name: 'modalState',
  initialState,
  reducers: {
    closeTransactionModal: (state) => {
      state.transactionFormOpen = false
    },    
    openTransactionModal: (state) => {
      state.transactionFormOpen = true;
    },
    closeAccountList: (state) => {
      state.accountListOpen = false
    },    
    openAccountList: (state) => {
      state.accountListOpen = true;
    },
    closeAccountForm: (state) => {
      state.accountFormOpen = false
    },    
    openAccountForm: (state) => {
      state.accountFormOpen = true;
    },
    closeTransactionHelper: (state) => {
      state.transactionHelperOpen = false
    },    
    openTransactionHelper: (state) => {
      state.transactionHelperOpen = true;
    },
  },
})

export const { 
  closeTransactionModal, 
  openTransactionModal, 
  closeAccountList, 
  openAccountList, 
  closeAccountForm, 
  openAccountForm,
  closeTransactionHelper,
  openTransactionHelper
} = modalState.actions

export default modalState.reducer