import { configureStore } from "@reduxjs/toolkit"
import { combineReducers } from "redux"
import { appReducer } from "./appSlice"
import { patientReducer } from "./patientSlice"
import { caseReducer } from "./caseSlice"

const rootReducer = combineReducers({
  app: appReducer,
  patient: patientReducer,
  cases: caseReducer
})

const store = configureStore({
  reducer: rootReducer
})

export default store