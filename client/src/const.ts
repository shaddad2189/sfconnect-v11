// Standalone authentication - no environment variables needed

export const APP_TITLE = "SF Connect";

export const APP_LOGO = "https://placehold.co/128x128/0066CC/FFFFFF?text=SF";

// Generate login URL for custom authentication
export const getLoginUrl = () => {
  return "/login";
};
