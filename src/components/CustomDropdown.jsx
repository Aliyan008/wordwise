import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import './CustomDropdown.css'

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)
  const listId = useId()

  const selected = options.find((o) => o.value === value)
  const displayText = selected ? selected.label : ''

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  const handleSelect = (optionValue) => {
    if (optionValue !== value) onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`custom-dropdown ${className}`.trim()} ref={wrapperRef}>
      {label && <span className="custom-dropdown-label">{label}</span>}
      <button
        type="button"
        className={`custom-dropdown-trigger ${isOpen ? 'custom-dropdown-trigger-open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={ariaLabel}
      >
        <span className="custom-dropdown-value">{displayText}</span>
        <ChevronDown
          size={16}
          className={`custom-dropdown-chevron ${isOpen ? 'custom-dropdown-chevron-open' : ''}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <ul
          id={listId}
          className="custom-dropdown-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`custom-dropdown-option ${isSelected ? 'custom-dropdown-option-selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default CustomDropdown
