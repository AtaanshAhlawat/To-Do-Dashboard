import React from "react";
import { COLORS, GRADIENTS } from "../../constants/uiConstants";

export const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  style = {},
  ...props
}) => {
  const baseStyle = {
    fontWeight: 700,
    fontSize: "1.1rem",
    padding: "1rem 2rem",
    borderRadius: "1rem",
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "all 0.2s ease",
    ...style,
  };

  const variants = {
    primary: {
      background: GRADIENTS.blueGradient,
      color: "#fff",
      boxShadow: COLORS.blueShadow,
    },
    secondary: {
      background: "transparent",
      border: `2px solid ${COLORS.blue}`,
      color: COLORS.blue,
    },
    danger: {
      background: "#ef4444",
      color: "#fff",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variants[variant] }}
      {...props}
    >
      {children}
    </button>
  );
};
