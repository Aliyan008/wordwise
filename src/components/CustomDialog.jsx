import './CustomDialog.css'

function CustomDialog({ isOpen, title, children }) {
  if (!isOpen) return null

  return (
    <div className="custom-dialog-overlay">
      <div className="custom-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        {title && <h2 id="dialog-title" className="custom-dialog-title">{title}</h2>}
        <div className="custom-dialog-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default CustomDialog
