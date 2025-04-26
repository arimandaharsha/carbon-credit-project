// Color palette for the dashboard - Enhanced green palette 
export const colors = {
  white: '#FFFFFF',
  black: '#000000',
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  eco: {
    light: '#dcfce7', // green-100
    medium: '#22c55e', // green-500
    dark: '#15803d', // green-700
    darkest: '#14532d', // green-900
    gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    leaf: '#22c55e',
    earth: '#15803d',
    sky: '#0ea5e9',
    water: '#0284c7',
    sunset: '#f59e0b',
  },
  accent: {
    blue: '#3b82f6',
    yellow: '#eab308',
    red: '#ef4444',
    primary: '#22c55e',
    secondary: '#15803d',
    tertiary: '#0ea5e9',
  }
};

// Utility function for creating scrollable containers with custom scrollbars
export const createScrollStyles = (baseStyles = {}) => ({
  ...baseStyles,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${colors.green[300]} ${colors.green[50]}`,
  // We'll need to apply these as actual CSS classes instead
});

// Shared styles for reuse - Enhanced modern styling
export const styles = {
  // Layout
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: colors.green[50],
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1.5rem',
  },
  maxWidthWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  
  // Cards and containers - Enhanced with subtle shadows and animations
  card: {
    backgroundColor: colors.white,
    borderRadius: '1rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.03)',
    overflow: 'hidden',
    border: `1px solid ${colors.green[100]}`,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  cardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.07), 0 6px 10px rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: `1px solid ${colors.green[100]}`,
    background: `linear-gradient(to right, ${colors.green[50]}, ${colors.white})`,
  },
  cardBody: {
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.green[800],
    marginBottom: '0.5rem',
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: colors.gray[600],
  },
  
  // Grid layouts
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  
  // Text styles
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.green[900],
    marginBottom: '1rem',
  },
  subheading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.green[800],
    marginBottom: '0.75rem',
  },
  paragraph: {
    fontSize: '1rem',
    color: colors.gray[700],
    lineHeight: 1.6,
    marginBottom: '1rem',
  },
  
  // Button styles
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.5rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    fontSize: '0.875rem',
    border: 'none',
    outline: 'none',
  },
  primaryButton: {
    backgroundColor: colors.green[600],
    color: colors.white,
    padding: '0.75rem 1.5rem',
    boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)`,
  },
  primaryButtonHover: {
    backgroundColor: colors.green[700],
    boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)`,
    transform: `translateY(-1px)`,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    color: colors.green[700],
    padding: '0.75rem 1.5rem',
    border: `1px solid ${colors.green[200]}`,
  },
  secondaryButtonHover: {
    backgroundColor: colors.green[50],
    transform: `translateY(-1px)`,
  },
  iconButton: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.gray[600],
    backgroundColor: 'transparent',
  },
  iconButtonHover: {
    backgroundColor: colors.gray[100],
    color: colors.gray[900],
  },
  
  // Form elements
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${colors.gray[300]}`,
    fontSize: '0.875rem',
    width: '100%',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  inputFocus: {
    borderColor: colors.green[500],
    boxShadow: `0 0 0 3px rgba(34, 197, 94, 0.2)`,
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.gray[700],
    marginBottom: '0.5rem',
  },
  
  // Tables
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    borderSpacing: 0,
  },
  tableHeader: {
    textAlign: 'left' as const,
    padding: '0.75rem 1rem',
    fontWeight: 500,
    fontSize: '0.875rem',
    color: colors.green[900],
    backgroundColor: colors.green[50],
    borderBottom: `1px solid ${colors.green[200]}`,
  },
  tableCell: {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: colors.gray[700],
    borderBottom: `1px solid ${colors.gray[200]}`,
  },
  tableRow: {
    transition: 'background-color 0.2s ease',
  },
  tableRowHover: {
    backgroundColor: colors.gray[50],
  },
  
  // Empty state
  emptyState: {
    textAlign: 'center' as const,
    padding: '2rem 1rem',
  },
  emptyStateTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: colors.gray[800],
    marginBottom: '0.5rem',
  },
  emptyStateText: {
    fontSize: '0.875rem',
    color: colors.gray[500],
    maxWidth: '20rem',
    margin: '0 auto',
  },
  
  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    backgroundColor: colors.white,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    position: 'relative' as const,
    zIndex: 10,
    backgroundImage: `linear-gradient(to right, ${colors.eco.medium}15, ${colors.eco.dark}05)`,
  },
  
  // Search input
  search: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '24rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${colors.gray[200]}`,
    transition: 'all 0.2s ease',
  },
  searchFocused: {
    boxShadow: `0 0 0 3px rgba(34, 197, 94, 0.2)`,
    borderColor: colors.green[500],
  },
  searchInput: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    border: 'none',
    flex: 1,
    outline: 'none',
    backgroundColor: 'transparent',
  },
  searchIcon: {
    padding: '0 0.75rem',
    color: colors.gray[400],
  },
  
  // User profile
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '9999px',
    backgroundColor: colors.green[100],
    color: colors.green[700],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.gray[900],
  },
  userRole: {
    fontSize: '0.75rem',
    color: colors.gray[500],
  },
  
  // Approve/reject buttons
  approveButton: {
    backgroundColor: colors.green[50],
    color: colors.green[700],
    border: `1px solid ${colors.green[200]}`,
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  approveButtonHover: {
    backgroundColor: colors.green[100],
    borderColor: colors.green[300],
  },
  rejectButton: {
    backgroundColor: colors.white,
    color: colors.gray[700],
    border: `1px solid ${colors.gray[300]}`,
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  rejectButtonHover: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[400],
  },
  
  // Loading indicator
  loader: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  loaderText: {
    fontSize: '0.875rem',
    color: colors.gray[600],
    marginTop: '1rem',
  },
  
  // Transaction modal
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '32rem',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: `1px solid ${colors.gray[200]}`,
    backgroundColor: colors.green[50],
  },
  modalBody: {
    padding: '1.5rem',
  },
  modalFooter: {
    padding: '1.25rem 1.5rem',
    borderTop: `1px solid ${colors.gray[200]}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.gray[900],
    margin: 0
  },
  
  // Transactions
  transactionsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    maxHeight: '400px',
    padding: '1rem',
    ...createScrollStyles(),
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    border: `1px solid ${colors.green[100]}`,
    background: `linear-gradient(to right, ${colors.white}, ${colors.green[50]})`,
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.05)',
    },
  },
  transactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.gray[800],
  },
  transactionDate: {
    fontSize: '0.75rem',
    color: colors.gray[500],
  },
  transactionDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
  },
  transactionParty: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  transactionInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
  },
  transactionActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  
  // Table container with scrolling
  tableContainer: {
    maxHeight: '400px',
    borderRadius: '0.5rem',
    border: `1px solid ${colors.gray[200]}`,
    ...createScrollStyles(),
  },
  
  // Allocation button
  allocateButton: {
    backgroundColor: colors.eco.medium,
    color: colors.white,
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: colors.eco.dark,
    },
    '&:disabled': {
      backgroundColor: colors.gray[300],
      cursor: 'not-allowed',
    },
  },
  
  // Section title with decorative underline
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.green[800],
    marginBottom: '1.25rem',
    paddingBottom: '0.5rem',
    borderBottom: `2px solid ${colors.green[200]}`,
    position: 'relative' as const,
    '&::after': {
      content: '""',
      position: 'absolute' as const,
      bottom: '-2px',
      left: 0,
      width: '3rem',
      height: '2px',
      backgroundColor: colors.green[500],
    },
  },
};

// For React components that need type safety
export type StylePropertyType = keyof typeof styles; 