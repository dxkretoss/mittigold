import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const showSuccess = useCallback((title, msg) => {
    setToast({ title, msg });
    setIsVisible(true);

    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setToast(null);
      }, 300);
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess }}>
      {children}
      {toast && (
        <div className={`toast-overlay ${isVisible ? 'show' : ''}`}>
          <div className="success-card">
            <div className="check-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="#3D7A5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4>{toast.title}</h4>
            <p>{toast.msg}</p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
