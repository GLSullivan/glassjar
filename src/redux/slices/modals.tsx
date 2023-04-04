import { createSlice }          from '@reduxjs/toolkit'

export interface ModalState {
  transactionFormOpen: boolean,
  accountFormOpen: boolean,
}

const initialState: ModalState = {
  transactionFormOpen: false,
  accountFormOpen: false,
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
    closeAccountModal: (state) => {
      state.accountFormOpen = false
    },    
    openAccountModal: (state) => {
      state.accountFormOpen = true;
    },
  },
})

export const { 
  closeTransactionModal, 
  openTransactionModal, 
  closeAccountModal, 
  openAccountModal 
} = modalState.actions

export default modalState.reducer