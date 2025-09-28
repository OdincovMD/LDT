// store/streamSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentCase: null,
  currentPatient: null,
  operationMode: 'playback', // 'playback' | 'simulation' - ВЫБОР РЕЖИМА РАБОТЫ
  recordingMode: 'idle', // 'idle' | 'recording' | 'reviewing' - ТЕКУЩЕЕ СОСТОЯНИЕ
  isConnected: false,
  hasUnsavedChanges: false,
  recordingStartTime: null,
  dataPoints: [],
  historicalData: [],
  isSimulating: false, // статус симуляции на бэкенде
  caseHasData: false
}

const streamSlice = createSlice({
  name: 'stream',
  initialState,
  reducers: {
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload
      state.currentCase = null
      state.operationMode = 'playback'
      state.recordingMode = 'idle'
      state.isSimulating = false
    },
    setCurrentCase: (state, action) => {
      state.currentCase = action.payload
      state.recordingMode = 'reviewing'
      state.hasUnsavedChanges = false
      state.isSimulating = false
    },
    setOperationMode: (state, action) => {
      state.operationMode = action.payload
      state.recordingMode = action.payload === 'simulation' ? 'idle' : 'reviewing'
      state.hasUnsavedChanges = false
      state.dataPoints = []
      state.isSimulating = false
    },
    startRecording: (state) => {
      if (state.operationMode === 'simulation') {
        state.recordingMode = 'recording'
        state.recordingStartTime = new Date().toISOString()
        state.hasUnsavedChanges = true
        state.dataPoints = []
      }
    },
    saveRecording: (state) => {
      state.hasUnsavedChanges = false
      state.recordingMode = 'idle'
      state.isSimulating = false
      state.caseHasData = true
      state.operationMode = 'playback'
    },
    addDataPoint: (state, action) => {
      state.dataPoints.push({
        ...action.payload,
        timestamp: new Date().toISOString()
      })
    },
    setHistoricalData: (state, action) => {
      state.historicalData = action.payload
    },
    clearData: (state) => {
      state.dataPoints = []
      state.historicalData = []
      state.hasUnsavedChanges = false
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload
    },
    setSimulationStatus: (state, action) => {
      state.isSimulating = action.payload
    },
    setCaseHasData: (state, action) => {
      state.caseHasData = action.payload
    },
    setCurrentCase: (state, action) => {
      state.currentCase = action.payload
      state.recordingMode = 'reviewing'
      state.hasUnsavedChanges = false
      state.isSimulating = false
      state.caseHasData = false // сбрасываем до загрузки данных
    }
  }
})

export const {
  setCurrentPatient,
  setCurrentCase,
  setOperationMode,
  startRecording,
  saveRecording,
  addDataPoint,
  setHistoricalData,
  clearData,
  setConnectionStatus,
  setSimulationStatus,
  setCaseHasData
} = streamSlice.actions

export const streamReducer = streamSlice.reducer