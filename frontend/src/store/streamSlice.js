/**
 * @file streamSlice.js
 * @description Redux slice для управления потоковыми данными и режимами работы. Обрабатывает запись, просмотр данных, состояние подключения и ошибки.
 */
// store/streamSlice.js
import { createSlice } from '@reduxjs/toolkit'

/**
 * Состояние потока:
 * - operationMode: 'playback' | 'record' — верхнеуровневый режим
 * - recordingMode: 'idle' | 'recording' | 'reviewing' — под-состояние записи/просмотра
 * - dataPoints: текущая несохранённая запись (очищается при старте записи)
 * - historicalData: сохранённые точки кейса для просмотра
 * - caseHasData: у выбранного кейса есть сохранённые данные
 * - hasUnsavedChanges: есть несохранённые изменения текущей записи
 * - isConnected: сетевой статус стрима
 */
const initialState = {
  currentCase: null,
  currentPatient: null,

  operationMode: 'playback',     // 'playback' | 'record'
  recordingMode: 'idle',         // 'idle' | 'recording' | 'reviewing'

  isConnected: false,
  hasUnsavedChanges: false,
  recordingStartTime: null,

  dataPoints: [],                // несохранённая запись
  historicalData: [],            // сохранённые данные для просмотра

  caseHasData: false,
  error: null,
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

      state.hasUnsavedChanges = false
      state.recordingStartTime = null
      state.dataPoints = []
      state.historicalData = []
      state.caseHasData = false
      state.error = null
    },

    setCurrentCase: (state, action) => {
      state.currentCase = action.payload

      state.operationMode = 'playback'
      state.recordingMode = 'reviewing' // при выборе кейса — просмотр

      state.hasUnsavedChanges = false
      state.recordingStartTime = null
      state.dataPoints = []
      // фактические данные подтянутся через setHistoricalData
      state.caseHasData = false
      state.error = null
    },

    setOperationMode: (state, action) => {
      const mode = action.payload // 'playback' | 'record'
      state.operationMode = mode
      state.recordingMode = mode === 'record' ? 'idle' : 'reviewing'
      state.hasUnsavedChanges = false
      state.recordingStartTime = null
      state.dataPoints = []
      state.error = null
    },

    startRecording: (state) => {
      if (state.operationMode === 'record') {
        state.recordingMode = 'recording'
        state.recordingStartTime = new Date().toISOString()
        state.hasUnsavedChanges = true
        state.dataPoints = []
        state.error = null
      }
    },

    stopRecording: (state) => {
      if (state.recordingMode === 'recording') {
        state.recordingMode = 'idle'
      }
    },

    saveRecording: (state) => {
      // Факт сохранения на бэкенде должен подтвердить thunk.
      // Здесь — только перевод UI в просмотр.
      state.hasUnsavedChanges = false
      state.operationMode = 'playback'
      state.recordingMode = 'reviewing'
      state.caseHasData = true
      state.recordingStartTime = null
    },

    addDataPoint: (state, action) => {
      const { timestamp, ...rest } = action.payload || {}
      state.dataPoints.push({
        ...rest,
        timestamp: timestamp ?? new Date().toISOString(),
      })
      state.hasUnsavedChanges = true
    },

    setHistoricalData: (state, action) => {
      state.historicalData = action.payload || []
      state.caseHasData = (state.historicalData?.length ?? 0) > 0
    },

    clearData: (state) => {
      state.dataPoints = []
      state.historicalData = []
      state.hasUnsavedChanges = false
      state.caseHasData = false
      state.recordingStartTime = null
      state.error = null
    },

    setConnectionStatus: (state, action) => {
      state.isConnected = !!action.payload
    },

    setCaseHasData: (state, action) => {
      state.caseHasData = !!action.payload
    },

    setError: (state, action) => {
      state.error = action.payload ?? null
    },
  },
})

export const {
  setCurrentPatient,
  setCurrentCase,
  setOperationMode,
  startRecording,
  stopRecording,
  saveRecording,
  addDataPoint,
  setHistoricalData,
  clearData,
  setConnectionStatus,
  setCaseHasData,
  setError,
} = streamSlice.actions

export const streamReducer = streamSlice.reducer
