import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        className="form-checkbox h-4 w-4 rounded text-primary border-gray-300 focus:ring-primary focus:ring-offset-0"
        {...props}
      />
      {label && <span className="ml-2 text-sm text-charcoal">{label}</span>}
    </label>
  );
};