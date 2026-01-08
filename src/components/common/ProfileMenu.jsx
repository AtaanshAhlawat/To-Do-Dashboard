import React, { useRef } from "react";
import { User } from "lucide-react";
import { useClickOutside } from "../../hooks/useClickOutside";
import { COLORS } from "../../constants/uiConstants";

export const ProfileMenu = ({ 
  user, 
  showMenu, 
  setShowMenu, 
  onLogout, 
  onDeleteAccount 
}) => {
  const menuRef = useRef(null);
  
  useClickOutside(menuRef, () => setShowMenu(false), showMenu);

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "#fff",
          border: `2px solid #e2e8f0`,
          borderRadius: "0.75rem",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = COLORS.blue;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0";
        }}
      >
        <User size={20} color={COLORS.blue} />
        <span style={{ fontWeight: 600, color: "#334155" }}>
          {user?.username}
        </span>
      </button>

      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            right: 0,
            background: "#fff",
            borderRadius: "0.75rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            padding: "0.75rem",
            minWidth: "200px",
            zIndex: 100,
            animation: "slideDown 0.2s ease",
          }}
        >
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              width: "100%",
              background: "none",
              border: "none",
              color: "#334155",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "0.95rem",
              padding: "0.6rem 0.5rem",
              borderRadius: "6px",
              transition: "all 0.2s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
            onClick={() => {
              setShowMenu(false);
              onLogout();
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 17L21 12L16 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign out
          </button>

          <div
            style={{
              height: "1px",
              background: "#f1f5f9",
              margin: "0.5rem 0",
            }}
          ></div>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              width: "100%",
              background: "none",
              border: "none",
              color: "#ef4444",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "0.95rem",
              padding: "0.6rem 0.5rem",
              borderRadius: "6px",
              transition: "all 0.2s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
            onClick={() => {
              setShowMenu(false);
              onDeleteAccount();
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Delete account
          </button>
        </div>
      )}
    </div>
  );
};
