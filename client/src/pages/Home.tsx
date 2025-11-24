import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Home page that redirects to login
 */
export default function Home() {
  useEffect(() => {
    // Simple redirect to login page
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}
