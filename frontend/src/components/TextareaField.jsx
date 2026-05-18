import './FormFields.css';

function TextareaField({ label, ...props }) {
  return (
    <label className="field-wrap">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}

export default TextareaField;
