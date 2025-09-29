// This file is for reference only.

export const userDummy = {
    // also stored in a token
    id: null, 
    email: null,
    name: null,
    created_at: null,

//    // we do not want to store this in frontend's store
//    hashed_password: null, 
}

export const patientDummy = {
    id: null,
    name: null,
    birth_date: null,
    created_at: null,

    owner_id: null,
}

export const caseDummy = {
    id: null,
    description: null,
    created_at: null,

    patient_id: null,
}

export const rawSignalDummy = {
    id: null,
    timestamp: null,
    bpm: null,
    uc: null,

    case_id: null
}

export const predictionDummy = {
    id: null,
    model_name: null,
    probability: 0,
    label: null,
    alert: null,
    created_at: null,

    case_id: null
}