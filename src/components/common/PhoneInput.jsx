import React from 'react';
import PhoneInput2 from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export const PhoneInput = ({
  value = '',
  onChange,
  disabled = false,
  placeholder = '+91 98250 12345',
  country = 'in',
  enableSearch = true,
  className = '',
}) => {
  return (
    <div className={`phone-input-wrapper ${className}`}>
      <PhoneInput2
        country={country}
        value={value || ''}
        onChange={(phone) => {
          if (onChange) {
            const formatted = phone ? (phone.startsWith('+') ? phone : `+${phone}`) : '';
            onChange(formatted);
          }
        }}
        disabled={disabled}
        enableSearch={enableSearch}
        searchPlaceholder="Search country or dial code..."
        searchNotFound="No matching country"
        placeholder={placeholder}
        containerClass="mg-phone-container"
        inputClass="mg-phone-input"
        buttonClass="mg-phone-button"
        dropdownClass="mg-phone-dropdown"
      />
    </div>
  );
};
