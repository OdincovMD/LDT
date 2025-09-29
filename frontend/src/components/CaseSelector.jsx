// components/CaseSelector.jsx
import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ChevronDown, User, FolderPlus, Clock } from "lucide-react";
import { setCurrentPatient, setCurrentCase } from "../store/streamSlice";
import { createCase, getCases } from "../asyncActions/cases";
import { getPatients } from "../asyncActions/patients";

const tz = "Europe/Warsaw";
const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz,
  }).format(d);
};

const ageFromBirthDate = (birth) => {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
};

const CaseSelector = () => {
  const dispatch = useDispatch();

  const user = useSelector((s) => s.app.user);
  const patient_array = useSelector((s) => s.patient.patient_array) ?? [];
  const case_array = useSelector((s) => s.cases.case_array) ?? [];
  const { currentPatient, currentCase, mode } = useSelector((s) => s.stream);

  // локальные дропдауны — управляем через ref для закрытия по клику вне
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = React.useState(false);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = React.useState(false);
  const patientDDRef = useRef(null);
  const caseDDRef = useRef(null);

  // 1) грузим пациентов пользователя
  useEffect(() => {
    if (user?.id) {
      dispatch(getPatients(user.id));
    }
  }, [dispatch, user?.id]);

  // 2) при смене currentPatient — подтянуть кейсы (на случай, если id пришёл извне)
  useEffect(() => {
    if (currentPatient) {
      dispatch(getCases(currentPatient));
    }
  }, [dispatch, currentPatient]);

  // 3) закрытие дропдаунов по клику вне/escape
  useEffect(() => {
    const onClick = (e) => {
      if (
        isPatientDropdownOpen &&
        patientDDRef.current &&
        !patientDDRef.current.contains(e.target)
      ) {
        setIsPatientDropdownOpen(false);
      }
      if (
        isCaseDropdownOpen &&
        caseDDRef.current &&
        !caseDDRef.current.contains(e.target)
      ) {
        setIsCaseDropdownOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsPatientDropdownOpen(false);
        setIsCaseDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isPatientDropdownOpen, isCaseDropdownOpen]);

  // выбранный пациент
  const selectedPatient = useMemo(() => {
    if (!patient_array.length || !currentPatient) return null;
    return patient_array.find((p) => p.id === currentPatient) || null;
  }, [patient_array, currentPatient]);

  // кейсы выбранного пациента
  const patientCases = useMemo(() => {
    if (!case_array.length || !currentPatient) return [];
    return case_array.filter((c) => c.patient_id === currentPatient);
  }, [case_array, currentPatient]);

  const handlePatientSelect = useCallback(
    (patient) => {
      dispatch(setCurrentPatient(patient.id));
      setIsPatientDropdownOpen(false);
      // кейсы подтянет useEffect по currentPatient
      // при смене пациента сбросим текущий кейс:
      dispatch(setCurrentCase(null));
    },
    [dispatch]
  );

  const handleCaseSelect = useCallback(
    (caseItem) => {
      dispatch(setCurrentCase(caseItem));
      setIsCaseDropdownOpen(false);
    },
    [dispatch]
  );

  const handleNewCase = useCallback(async () => {
    if (!currentPatient) return;
    try {
      const result = await dispatch(
        createCase({
          patientId: currentPatient,
          description: `Исследование от ${new Intl.DateTimeFormat("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: tz,
          }).format(new Date())}`,
        })
      ).unwrap();
      dispatch(setCurrentCase(result));
      setIsCaseDropdownOpen(false);
    } catch (error) {
      // тихо уведомляем; можешь заменить на toast
      alert(`Ошибка создания исследования: ${error.message}`);
    }
  }, [dispatch, currentPatient]);

  return (
    <div className="bg-slate-800 rounded-2xl p-4 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Пациент */}
        <div className="flex-1" ref={patientDDRef}>
          <label className="block text-sm text-slate-400 mb-2">Пациент</label>
          <button
            onClick={() => setIsPatientDropdownOpen((v) => !v)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-slate-600 transition-colors"
            aria-haspopup="listbox"
            aria-expanded={isPatientDropdownOpen}
          >
            <div className="flex items-center space-x-3">
              <User size={20} className="text-slate-400" />
              <span className="text-white">
                {selectedPatient ? selectedPatient.name : "Выберите пациента"}
              </span>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {isPatientDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {patient_array.length > 0 ? (
                patient_array.map((patient) => {
                  const age = ageFromBirthDate(patient.birth_date);
                  return (
                    <button
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-600 transition-colors flex items-center justify-between"
                      role="option"
                    >
                      <span className="text-white">{patient.name}</span>
                      {age !== null && (
                        <span className="text-sm text-slate-400">{age} лет</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-slate-400 text-center">Нет пациентов</div>
              )}
            </div>
          )}
        </div>

        {/* Исследование */}
        <div className="flex-1" ref={caseDDRef}>
          <label className="block text-sm text-slate-400 mb-2">Исследование</label>
          <button
            onClick={() => currentPatient && setIsCaseDropdownOpen((v) => !v)}
            disabled={!currentPatient}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-haspopup="listbox"
            aria-expanded={isCaseDropdownOpen}
          >
            <div className="flex items-center space-x-3">
              <Clock size={20} className="text-slate-400" />
              <span className="text-white">
                {currentCase
                  ? currentCase.description || `Исследование #${currentCase.id}`
                  : currentPatient
                  ? "Выберите исследование"
                  : "Сначала выберите пациента"}
              </span>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {isCaseDropdownOpen && currentPatient && (
            <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
              {/* Новое исследование */}
              <button
                onClick={handleNewCase}
                className="w-full px-4 py-3 text-left hover:bg-slate-600 transition-colors flex items-center space-x-3 text-green-400"
              >
                <FolderPlus size={16} />
                <span>Новое исследование</span>
              </button>

              {/* Существующие */}
              {patientCases.length > 0 ? (
                patientCases.map((caseItem) => (
                  <button
                    key={caseItem.id}
                    onClick={() => handleCaseSelect(caseItem)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-600 transition-colors border-t border-slate-600 first:border-t-0"
                    role="option"
                  >
                    <div>
                      <div className="text-white font-medium">
                        {caseItem.description || `Исследование #${caseItem.id}`}
                      </div>
                      <div className="text-sm text-slate-400">
                        {fmtDate(caseItem.created_at)}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-slate-400 border-t border-slate-600 text-center">
                  Нет исследований
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Информация о режиме */}
      {mode === "reviewing" && currentCase && (
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="text-blue-400 text-sm">
            📊 Режим просмотра:{" "}
            {currentCase.description || `Исследование #${currentCase.id}`}
          </div>
        </div>
      )}

      {mode === "recording" && currentCase && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="text-red-400 text-sm">
            🔴 Режим записи:{" "}
            {currentCase.description || `Исследование #${currentCase.id}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CaseSelector);