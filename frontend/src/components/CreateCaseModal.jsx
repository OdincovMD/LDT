/**
 * @component CreateCaseModal
 * @description Модальное окно создания нового медицинского исследования (кейса). Позволяет ввести описание исследования для выбранного пациента.
 */
import React, { useEffect, useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { X, FileText, Save } from "lucide-react";

import { createCase, getCases } from "../asyncActions/cases";

const MAX_DESCRIPTION = 500;

const CreateCaseModal = ({ isOpen, onClose, patientId, patientName, onCreated }) => {
  const dispatch = useDispatch();
  const wrapperRef = useRef(null);
  const [backendError, setBackendError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    setFocus,
  } = useForm({
    defaultValues: { description: "" },
    mode: "onSubmit",
  });

  const handleClose = useCallback(() => {
    reset();
    setBackendError("");
    onClose?.();
  }, [onClose, reset]);

  // ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Клик по подложке — закрыть
  const onBackdropClick = useCallback(
    (e) => {
      if (e.target === wrapperRef.current) handleClose();
    },
    [handleClose]
  );

  // Автофокус без собственного ref — через RHF
  useEffect(() => {
    if (isOpen) {
      // небольшая задержка, чтобы модалка отрендерилась
      setTimeout(() => setFocus("description"), 0);
    }
  }, [isOpen, setFocus]);

  const onSubmitForm = useCallback(
    async (data) => {
      setBackendError("");
      if (!patientId) {
        setBackendError("Не выбран пациент.");
        return;
      }

      const desc = (data.description ?? "").trim();

      try {
        // соответствуем сигнатуре thunk'а: camelCase
        const created = await dispatch(
          createCase({
            patientId,
            description: desc, // строка; если пустая — уйдёт "", не null
          })
        ).unwrap();

        // гарантируем описание в выбранном кейсе прямо сейчас
        const createdWithDesc = { ...created, description: desc };
        onCreated?.(createdWithDesc);

        // обновим список (если бэк не вернёт описание — в UI оно уже есть через onCreated)
        await dispatch(getCases(patientId));

        handleClose();
      } catch (err) {
        let msg = "Не удалось создать исследование.";
        if (err && typeof err === "object") {
          if (err.detail && typeof err.detail === "string") msg = err.detail;
          else if (err.message) msg = err.message;
        }
        setBackendError(msg);
        if (msg.toLowerCase().includes("description")) {
          setError("description", { message: msg });
        }
      }
    },
    [dispatch, handleClose, onCreated, patientId, setError]
  );

  if (!isOpen) return null;

  const submitDisabled = isSubmitting;

  return (
    <div
      ref={wrapperRef}
      onMouseDown={onBackdropClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-case-title"
      aria-describedby="create-case-desc"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full outline-none"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="create-case-title" className="text-xl font-semibold text-gray-900">
              Новое исследование
            </h2>
            {patientName && (
              <p id="create-case-desc" className="text-sm text-gray-600 mt-1">
                Пациент: {patientName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Закрыть модальное окно"
          >
            <X size={24} />
          </button>
        </div>

        {/* Ошибка бэка */}
        {backendError && (
          <div className="mx-6 mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">
            {backendError}
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание исследования
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText size={20} className="text-gray-400" />
              </div>
              <textarea
                {...register("description", {
                  maxLength: {
                    value: MAX_DESCRIPTION,
                    message: `Описание не должно превышать ${MAX_DESCRIPTION} символов`,
                  },
                })}
                id="description"
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-400"
                placeholder="Например: плановое КТГ, контроль после терапии…"
                disabled={submitDisabled}
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Поле необязательно. Максимум {MAX_DESCRIPTION} символов.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitDisabled}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitDisabled || !patientId}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitDisabled ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Создание…</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Создать</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateCaseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  patientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  patientName: PropTypes.string,
  onCreated: PropTypes.func,
};

export default React.memo(CreateCaseModal);