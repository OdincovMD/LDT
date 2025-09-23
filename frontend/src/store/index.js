import { configureStore } from "@reduxjs/toolkit"
import { combineReducers } from "redux"
import { appReducer } from "./appSlice"

const rootReducer = combineReducers({
  app: appReducer,
})

const store = configureStore({
  reducer: rootReducer
})

export default store