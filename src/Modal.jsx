import { useEffect } from 'react'

// Lightweight modal with backdrop + ESC close. Does not trap focus — adequate
// for 1–2 action confirmations in this app.
export default function Modal({ open, onClose, title, tone = 'neutral', children, actions }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }
  return (
    <div className="modal-overlay" onMouseDown={onBackdrop}>
      <div
        className={`modal modal-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-head">
          <h2 id="modal-title">{title}</h2>
          {onClose && (
            <button type="button" className="modal-close" onClick={onClose} aria-label="Sulge">
              ×
            </button>
          )}
        </header>
        <div className="modal-body">{children}</div>
        {actions && <footer className="modal-foot">{actions}</footer>}
      </div>
    </div>
  )
}
