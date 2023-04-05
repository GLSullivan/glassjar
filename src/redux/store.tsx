import { configureStore } from '@reduxjs/toolkit'
import activedates        from './slices/activedates'
import modalstate         from './slices/modals'
import transactions       from './slices/transactions'
import projectionsReducer from './slices/projections'; 

export const store = configureStore({
    reducer: {
        activeDates: activedates,
        modalState: modalstate,
        transactions: transactions,
        projections: projectionsReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch