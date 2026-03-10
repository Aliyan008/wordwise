import './CustomButton.css'

function CustomButton({ 
  variant = 'primary', 
  children, 
  onClick, 
  className = '', 
  fullWidth = false,
  ...props
}) {
  const buttonClasses = `custom-btn custom-btn-${variant} ${fullWidth ? 'custom-btn-full' : ''} ${className}`.trim()

  return (
    <button className={buttonClasses} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

export default CustomButton
