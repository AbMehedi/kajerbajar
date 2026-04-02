// src/components/ui/FormInput.jsx
// Shared input component used across login, register, and any future form.
// Member B owns this file.
//
// XP RULE: The input className was copy-pasted 9 times across register/login.
// Now it lives here once. To change the look of ALL form inputs → edit here only.
//
// Usage:
//   <FormInput id="email" type="email" value={email} onChange={...} placeholder="Email" required />
//   <FormInput id="bio" type="textarea" value={bio} onChange={...} placeholder="Tell us about you" />

export default function FormInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  minLength,
  label,
}) {
  const baseClass =
    'w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm'

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm text-slate-300 mb-1">
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`${baseClass} resize-none min-h-[80px]`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          minLength={minLength}
          className={baseClass}
        />
      )}
    </div>
  )
}
