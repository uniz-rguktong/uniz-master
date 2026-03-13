import { Check } from 'lucide-react';
import type * as React from 'react';

type CheckboxProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  defaultChecked?: boolean;
};










export function Checkbox({
  checked,
  onChange,
  className = '',
  size = 'md',
  disabled = false,
  defaultChecked = false
}: CheckboxProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Determine if this is a controlled component
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : defaultChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        {...isControlled ? { checked } : { defaultChecked }}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer" />

      <div
        className={`
          ${sizeClasses[size]}
          rounded-[4px]
          border-2
          transition-all
          duration-200
          ease-in-out
          flex
          items-center
          justify-center
          ${isChecked ?
        'bg-[#F4F2F0] border-[#1A1A1A]' :
        'bg-white border-[#D1D5DB]'}
          ${
        disabled ?
        'opacity-40 cursor-not-allowed' :
        `hover:border-[#6B7280] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1A1A1A] peer-focus-visible:ring-offset-2 ${isChecked ? 'hover:bg-[#ECEAE8]' : 'hover:bg-[#F9FAFB]'}`}
        `
        }>

        {isChecked &&
        <Check
          className={`${iconSizes[size]} text-[#1A1A1A] transition-all duration-150`}
          strokeWidth={3} />

        }
      </div>
    </label>);

}