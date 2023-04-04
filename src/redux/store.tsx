import { configureStore } from '@reduxjs/toolkit'
import activedate         from './slices/activedate'
import modalstate         from './slices/modals'

export const store = configureStore({
    reducer: {
        activeDate: activedate,
        modalState: modalstate,
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch