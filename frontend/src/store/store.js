import { configureStore } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  currentPage: 'home'
}

function appReducer(state = initialState, action) {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload }
    default:
      return state
  }
}

export const store = configureStore({
  reducer: {
    app: appReducer
  }
})