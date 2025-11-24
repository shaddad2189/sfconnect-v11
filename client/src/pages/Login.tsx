import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MFAVerification } from "@/components/MFAVerification";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [mfaEmail, setMfaEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if MFA is required
        if (data.mfaRequired) {
          setMfaEmail(data.email);
          setShowMFAVerification(true);
          setLoading(false);
          return;
        }

        // Store token and redirect
        handleLoginSuccess(data.token, data.user);
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (token: string, user: any) => {
    // Store token in localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    
    toast.success("Login successful!");
    
    // Redirect based on role
    if (user.role === "admin") {
      setLocation("/admin");
    } else {
      setLocation("/addin");
    }
  };

  const handleMFACancel = () => {
    setShowMFAVerification(false);
    setMfaEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{APP_TITLE}</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sfconnect.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm text-blue-900 font-semibold mb-2">Default Admin Credentials:</p>
            <p className="text-xs text-blue-700 font-mono">Email: admin@sfconnect.local</p>
            <p className="text-xs text-blue-700 font-mono">Password: Ch@ngE33#!!!</p>
            <p className="text-xs text-blue-600 mt-2">⚠️ Change these credentials immediately after first login</p>
          </div>
        </CardContent>
      </Card>

      {showMFAVerification && (
        <MFAVerification
          email={mfaEmail}
          onSuccess={handleLoginSuccess}
          onCancel={handleMFACancel}
        />
      )}
    </div>
  );
}
