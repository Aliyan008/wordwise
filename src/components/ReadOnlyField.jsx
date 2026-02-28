import './ReadOnlyField.css'

function ReadOnlyField({ label, value }) {
  return (
    <div className="readonly-field">
      <label className="readonly-label">{label}</label>
      <div className="readonly-value">{value}</div>
    </div>
  )
}

export default ReadOnlyField
