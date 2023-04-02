import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface ActiveDate {
    value: string
}

const initialState: ActiveDate = {
    value: (new Date().toISOString())
}

export const activeDate = createSlice({
    name: 'activeDate',
    initialState,
    reducers: {
        setActiveDate: (state, action: PayloadAction<string>) => {
            state.value = action.payload
        },
    },
})

export const { setActiveDate } = activeDate.actions

export default activeDate.reducer