import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

function ToastItem({ id, message, type, duration, onDismiss }) {
  return (
    <div className={`toast toast-${type}`} style={{ '--toast-duration': `${duration}ms` }}>
      <div className="toast-top">
        <span>{message}</span>
        <button className="toast-dismiss" onClick={() => onDismiss(id)}>✕</button>
      </div>
      <div className="toast-progress" />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(id => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type, duration }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
