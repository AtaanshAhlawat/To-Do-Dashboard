import React from "react";

export const DeleteAccountModal = ({ onConfirm, onCancel, isDeleting }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "1.5rem",
          boxShadow: "0 20px 80px rgba(0, 0, 0, 0.3)",
          padding: "2rem",
          width: "100%",
          maxWidth: "500px",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            color: "#ef4444",
            fontSize: "1.8rem",
            fontWeight: 700,
            textAlign: "center",
            margin: 0,
            marginBottom: "1rem",
          }}
        >
          ⚠️ Delete Account
        </h2>

        <p
          style={{
            fontSize: "1.1rem",
            color: "#374151",
            textAlign: "center",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          Are you absolutely sure you want to delete your account?
          <br />
          <br />
          <strong>
            This action cannot be undone and will permanently delete:
          </strong>
          <br />
          • Your account and profile
          <br />
          • All your tasks and data
          <br />• All your settings and preferences
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
          }}
        >
          <button
            style={{
              background: isDeleting ? "#9ca3af" : "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{
              background: isDeleting ? "#9ca3af" : "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};
