/**
 * @file index.js
 * @description Главный файл Redux store. Конфигурирует и объединяет все reducers приложения.
 */
import { configureStore } from "@reduxjs/toolkit"
import { combineReducers } from "redux"
import { appReducer } from "./appSlice"
import { patientReducer } from "./patientSlice"
import { caseReducer } from "./caseSlice"
import { streamReducer } from "./streamSlice"

const rootReducer = combineReducers({
  app: appReducer,
  patient: patientReducer,
  cases: caseReducer,
  stream: streamReducer
})

const store = configureStore({
  reducer: rootReducer
})

export default store