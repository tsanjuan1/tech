"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: ReactNode;
  pending?: boolean;
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: "3.4rem",
  padding: "0.95rem 1.2rem",
  border: "none",
  borderRadius: "1rem",
  background: "linear-gradient(135deg, #115e59, #0f766e)",
  color: "#f8fafc",
  cursor: "pointer",
  fontWeight: 700,
  letterSpacing: "0.01em",
  boxShadow: "0 16px 36px rgba(15, 118, 110, 0.22)",
  transition: "transform 160ms ease, opacity 160ms ease",
} as const;

export function SubmitButton({ children, pending: pendingProp }: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;

  return (
    <button
      disabled={pending}
      style={{
        ...buttonStyle,
        opacity: pending ? 0.72 : 1,
        transform: pending ? "translateY(0)" : "translateY(-1px)",
      }}
      type="submit"
    >
      {pending ? "Guardando..." : children}
    </button>
  );
}
