import './FormFields.css';

function SelectField({ label, options = [], ...props }) {
  return (
    <label className="field-wrap">
      <span>{label}</span>
      <select {...props}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default SelectField;
