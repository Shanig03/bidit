import './Button.css';

function Button({ children, variant = 'primary', type = 'button', ...props }) {
  const className = ['button', `button--${variant}`, props.className].filter(Boolean).join(' ');

  return (
    <button type={type} {...props} className={className}>
      {children}
    </button>
  );
}

export default Button;
