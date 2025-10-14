/**
 * @file ENDPOINTS.js
 * @description Конфигурация всех API endpoints и frontend routes приложения. Содержит пути для аутентификации, пациентов, исследований и потоковых данных.
 */
// imports/ENDPOINTS.js
export const FRONTEND_PAGES = {
    HOME: "/",
    PATIENTS: "/patients",
    DASHBOARD: "/dashboard",
    ABOUT: "/about",
    LOGIN: "/login",
    REGISTER: "/register",
    LOGOUT: "/logout"
}

export const PAGE_NAMES = {
    HOME: 'home',
    PATIENTS: 'patients',
    DASHBOARD: "dashboard",
    ABOUT: 'about',
    LOGIN: 'login',
    REGISTER: 'register',
}

const BACKEND_PREFIX = '/api'

const BASE_ROUTES = {
    AUTH: '/auth',
    CASES: '/cases', 
    PATIENTS: '/patients',
    PREDICTIONS: '/predictions',
    STREAM: '/stream',
    USERS: '/users',
    SIM: '/sim',
    WS_TOKEN: '/ws-token',
    BRIDGE: '/bridge',
}


export const BACKEND_ROUTES = Object.fromEntries(
    Object.entries(BASE_ROUTES).map(([key, path]) => [
        key, 
        `${BACKEND_PREFIX}${path}`
    ])
)

export const BACKEND_ENDPOINTS = {
    WS_TOKEN: {
        CREATE: `${BACKEND_ROUTES.WS_TOKEN}/create`,
        EXISTS: (userId, caseId) => `${BACKEND_ROUTES.WS_TOKEN}/exists?user_id=${userId}&case_id=${caseId}`,
        REVOKE: `${BACKEND_ROUTES.WS_TOKEN}/revoke`,
    },

    BRIDGE: {
        PROVISION_WS: `${BACKEND_ROUTES.BRIDGE}/provision/ws`,
    },

    AUTH: {
        REGISTER: `${BACKEND_ROUTES.AUTH}/register`,
        LOGIN: `${BACKEND_ROUTES.AUTH}/login`
    },
    
    CASES: {
        DEFAULT: `${BACKEND_ROUTES.CASES}/`,
        BY_PATIENT: (patientId) => `${BACKEND_ROUTES.CASES}/by-patient/${patientId}`,
    },
    
    PATIENTS: {
        DEFAULT: `${BACKEND_ROUTES.PATIENTS}/`,
        BY_USER: (userId) => `${BACKEND_ROUTES.PATIENTS}/by-user/${userId}`,
    },
    
    PREDICTIONS: {
        DEFAULT: `${BACKEND_ROUTES.PREDICTIONS}/`,
        BY_CASE: (caseId) => `${BACKEND_ROUTES.PREDICTIONS}/by-case/${caseId}`,
    },
    
    STREAM: {
        DATA: `${BACKEND_ROUTES.STREAM}/data`,
        DATA_BY_CASE: (caseId) => `${BACKEND_ROUTES.STREAM}/data/${caseId}`,
    },
    
    USERS: {
        BY_ID: (userId) => `${BACKEND_ROUTES.USERS}/${userId}`,
    },
    
    SIM: {
        START: `${BACKEND_ROUTES.SIM}/start`,
        STOP: `${BACKEND_ROUTES.SIM}/stop`,
        STATUS: `${BACKEND_ROUTES.SIM}/status`
    }
}