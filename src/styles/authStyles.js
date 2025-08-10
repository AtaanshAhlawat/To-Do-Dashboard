// Auth Component Styles
export const authStyles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 1000,
    padding: '20px',
    boxSizing: 'border-box',
  },
  form: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    marginTop: 0,
    marginBottom: '1.5rem',
    color: '#333',
    textAlign: 'center',
  },
  // Base styles for all form elements
  formElement: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.75rem',
    marginBottom: '1rem',
    fontSize: '1rem',
    borderRadius: '4px',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '1rem',
    boxSizing: 'border-box',
    '&:hover': {
      backgroundColor: '#3a7bc8',
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed',
    }
  },
  toggle: {
    color: '#4a90e2',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'block',
    marginTop: '1rem',
    '&:hover': {
      textDecoration: 'underline',
    }
  },
  error: {
    color: '#d9534f',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  success: {
    color: '#5cb85c',
    marginBottom: '1rem',
    textAlign: 'center',
  },
};

// Theme variables
export const theme = {
  colors: {
    primary: '#4a90e2',
    primaryHover: '#3a7bc8',
    error: '#d9534f',
    success: '#5cb85c',
    background: '#f5f5f5',
    text: '#333',
    textLight: '#666',
    border: '#ddd',
  },
  spacing: {
    small: '0.5rem',
    medium: '1rem',
    large: '2rem',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
  },
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
};

// Utility functions
export const getStyleWithTheme = (styleName, themeOverrides = {}) => {
  const theme = { ...theme, ...themeOverrides };
  const style = authStyles[styleName];
  
  // Handle dynamic styles
  if (typeof style === 'function') {
    return style(theme);
  }
  
  return style;
};
