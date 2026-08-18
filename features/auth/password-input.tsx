"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordInput({
  id,
  name,
  autoComplete,
  describedBy,
  invalid = false,
  onChange,
  minLength = 8,
  maxLength,
}: {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  describedBy?: string;
  invalid?: boolean;
  onChange?: () => void;
  minLength?: number;
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return <div className="auth-password-field">
    <input id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} required onChange={onChange} aria-describedby={describedBy} aria-invalid={invalid} />
    <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
      {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  </div>;
}
