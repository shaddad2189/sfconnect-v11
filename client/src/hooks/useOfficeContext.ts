import { useState, useEffect } from "react";

/**
 * Office.js types (simplified)
 */
declare global {
  interface Window {
    Office?: {
      context?: {
        mailbox?: {
          item?: {
            from?: {
              emailAddress?: string;
              displayName?: string;
            };
            subject?: string;
          };
        };
      };
      initialize?: (reason: any) => void;
      onReady?: () => Promise<any>;
    };
  }
}

export interface EmailContext {
  senderEmail: string | null;
  senderName: string | null;
  subject: string | null;
  isAvailable: boolean;
}

/**
 * Hook to access Outlook email context via Office.js
 */
export function useOfficeContext() {
  const [emailContext, setEmailContext] = useState<EmailContext>({
    senderEmail: null,
    senderName: null,
    subject: null,
    isAvailable: false,
  });

  useEffect(() => {
    // Check if Office.js is available
    if (typeof window.Office === "undefined") {
      console.log("[Office.js] Not available - running in standalone mode");
      return;
    }

    // Initialize Office.js
    const initializeOffice = async () => {
      try {
        if (window.Office?.onReady) {
          await window.Office.onReady();
        }

        // Get email context
        const item = window.Office?.context?.mailbox?.item;

        if (item) {
          setEmailContext({
            senderEmail: item.from?.emailAddress || null,
            senderName: item.from?.displayName || null,
            subject: item.subject || null,
            isAvailable: true,
          });
        }
      } catch (error) {
        console.error("[Office.js] Initialization error:", error);
      }
    };

    initializeOffice();
  }, []);

  return emailContext;
}

/**
 * Extract company name from email domain
 */
export function extractCompanyFromEmail(email: string | null): string | null {
  if (!email) return null;

  try {
    const domain = email.split("@")[1];
    if (!domain) return null;

    // Remove common TLDs and format as company name
    const companyName = domain
      .split(".")[0]
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return companyName;
  } catch (error) {
    console.error("[Email Parser] Error extracting company:", error);
    return null;
  }
}

/**
 * Parse sender name into first and last name
 */
export function parseSenderName(displayName: string | null): { firstName: string; lastName: string } {
  if (!displayName) {
    return { firstName: "", lastName: "" };
  }

  const parts = displayName.trim().split(/\s+/);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  // Assume first part is first name, rest is last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  return { firstName, lastName };
}
