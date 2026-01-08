import React from "react";

export const SearchBar = ({ value, onChange, placeholder = "Search for task..." }) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontSize: "1rem",
        padding: "0.75rem 1.25rem",
        borderRadius: "0.75rem",
        flex: 1,
        border: "2px solid #e2e8f0",
        background: "#fff",
        boxSizing: "border-box",
        minWidth: "200px",
      }}
    />
  );
};
