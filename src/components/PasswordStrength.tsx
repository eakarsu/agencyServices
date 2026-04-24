"use client";

import { getPasswordStrength } from "@/lib/validation";

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const strength = getPasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${strength.color}`}
            style={{ width: `${(strength.score / 6) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">{strength.label}</span>
      </div>
      <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
        <li className={password.length >= 8 ? "text-green-600" : ""}>At least 8 characters</li>
        <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>One uppercase letter</li>
        <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>One lowercase letter</li>
        <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>One number</li>
        <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : ""}>One special character</li>
      </ul>
    </div>
  );
}
