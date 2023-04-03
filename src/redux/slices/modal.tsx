import { createSlice }          from '@reduxjs/toolkit'
import type { PayloadAction }   from '@reduxjs/toolkit'

export interface ModalState {
  value: boolean
}

const initialState: ModalState = {
  value: true
}

export const modalState = createSlice({
  name: 'modalState',
  initialState,
  reducers: {
    closeModal: (state) => {
      state.value = false
    },
  },
})

export const { closeModal } = modalState.actions

export default modalState.reducer