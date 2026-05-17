import './FormFields.css';

function FormInput({ label, ...props }) {
  return (
    <label className="field-wrap">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export default FormInput;
