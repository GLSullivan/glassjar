import { configureStore } from '@reduxjs/toolkit'
import activedate         from './slices/activedate'

export const store = configureStore({
    reducer: {
        activeDate: activedate
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch