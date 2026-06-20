"use client";

import { useId, useState } from "react";
import { authPasswordInputClassName } from "@/components/auth/authInputClassName";
import { EyeIcon, EyeOffIcon } from "@/components/icons/Icons";

type PasswordFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showLabel: string;
  hideLabel: string;
  autoComplete?: string;
  required?: boolean;
};

export default function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  showLabel,
  hideLabel,
  autoComplete = "current-password",
  required = true,
}: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={fieldId}
        required={required}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={authPasswordInputClassName}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-ivory-muted hover:text-gold transition-colors p-1 rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40"
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        aria-controls={fieldId}
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}
