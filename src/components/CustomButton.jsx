import './CustomButton.css'

function CustomButton({ 
  variant = 'primary', 
  children, 
  onClick, 
  className = '', 
  fullWidth = false 
}) {
  const buttonClasses = `custom-btn custom-btn-${variant} ${fullWidth ? 'custom-btn-full' : ''} ${className}`.trim()

  return (
    <button className={buttonClasses} onClick={onClick}>
      {children}
    </button>
  )
}

export default CustomButton
