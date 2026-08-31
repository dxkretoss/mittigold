import React from 'react';

export const Button = ({
  variant = 'primary', // 'primary', 'outline', 'icon', 'icon-sm', 'danger-sm'
  children,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  disabled = false,
  title,
  ...props
}) => {
  let baseClass = 'btn-primary';
  if (variant === 'outline') baseClass = 'btn-outline';
  if (variant === 'icon') baseClass = 'iconbtn';
  if (variant === 'icon-sm') baseClass = 'icon-sm';
  if (variant === 'danger-sm') baseClass = 'icon-sm danger';

  return (
    <button
      type={type}
      className={`${baseClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {Icon && <Icon className={variant === 'icon' ? 'w-4 h-4' : variant.includes('sm') ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'} />}
      {children}
    </button>
  );
};
