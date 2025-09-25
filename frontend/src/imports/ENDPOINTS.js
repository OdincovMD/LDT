export const ENDPOINTS = {
    HOME: "/",
    CONTACT: "/contact",
    ABOUT: "/about",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard"
}

export const PAGE_NAMES = {
    HOME: 'home',
    CONTACT: 'contact',
    ABOUT: 'about',
    LOGIN: 'login',
    REGISTER: 'register',
    DASHBOARD: "dashboard"
}

const BACKEND_ROUTES = {
    AUTH: '/auth',
    CASES: '/cases',
    PATIENTS: '/patients',
    PREDICTIONS: '/predictions',
    STREAM: '/stream',
    USERS: '/users',
}

export const BACKEND_ENDPOINTS = {
    AUTH: {
        REGISTER: `${BACKEND_ROUTES.AUTH}/register`,
        LOGIN: `${BACKEND_ROUTES.AUTH}/login`
    },
    
    CASES: {
        DEFAULT: `${BACKEND_ROUTES.CASES}`,
        BY_PATIENT: (patientId) => `${BACKEND_ROUTES.CASES}/by-patient/${patientId}`,
    },
    
    PATIENTS: {
        DEFAULT: `${BACKEND_ROUTES.PATIENTS}`,
        BY_USER: (userId) => `${BACKEND_ROUTES.PATIENTS}/by-user/${userId}`,
    },
    
    PREDICTIONS: {
        DEFAULT: `${BACKEND_ROUTES.PREDICTIONS}`,
        BY_CASE: (caseId) => `${BACKEND_ROUTES.PREDICTIONS}/by-case/${caseId}`,
    },
    
    STREAM: {
        DATA: `${BACKEND_ROUTES.STREAM}/data`,
        DATA_BY_CASE: (caseId) => `${BACKEND_ROUTES.STREAM}/data/${caseId}`,
    },
    
    USERS: {
        BY_ID: (userId) => `${BACKEND_ROUTES.USERS}/${userId}`,
    },
}