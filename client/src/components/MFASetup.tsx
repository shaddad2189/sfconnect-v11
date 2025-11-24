import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, ShieldCheck, ShieldOff, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MFASetupProps {
  onClose?: () => void;
}

export function MFASetup({ onClose }: MFASetupProps) {
  const [step, setStep] = useState<"status" | "setup" | "enable" | "disable">("status");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Setup state
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  // Disable state
  const [password, setPassword] = useState("");

  // Load MFA status
  const loadStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/mfa/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMfaEnabled(data.enabled);
        setBackupCodesRemaining(data.backupCodesRemaining || 0);
      }
    } catch (error) {
      console.error("Failed to load MFA status:", error);
    }
  };

  // Initialize MFA setup
  const startSetup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/mfa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep("setup");
      } else {
        toast.error(data.error || "Failed to setup MFA");
      }
    } catch (error) {
      toast.error("Failed to setup MFA");
    } finally {
      setLoading(false);
    }
  };

  // Enable MFA
  const enableMFA = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/mfa/enable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setBackupCodes(data.backupCodes);
        setStep("enable");
        setMfaEnabled(true);
        toast.success("MFA enabled successfully!");
      } else {
        toast.error(data.error || "Invalid verification code");
      }
    } catch (error) {
      toast.error("Failed to enable MFA");
    } finally {
      setLoading(false);
    }
  };

  // Disable MFA
  const disableMFA = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/mfa/disable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMfaEnabled(false);
        setStep("status");
        setPassword("");
        toast.success("MFA disabled successfully");
      } else {
        toast.error(data.error || "Failed to disable MFA");
      }
    } catch (error) {
      toast.error("Failed to disable MFA");
    } finally {
      setLoading(false);
    }
  };

  // Copy backup codes
  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  // Load status on mount
  useState(() => {
    loadStatus();
  });

  return (
    <div className="space-y-4">
      {step === "status" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mfaEnabled ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  Two-Factor Authentication Enabled
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </>
              )}
            </CardTitle>
            <CardDescription>
              {mfaEnabled
                ? "Your account is protected with two-factor authentication"
                : "Add an extra layer of security to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mfaEnabled ? (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    MFA is active. You have {backupCodesRemaining} backup codes remaining.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="destructive"
                  onClick={() => setStep("disable")}
                  className="w-full"
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Disable Two-Factor Authentication
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Protect your account by requiring a code from your authenticator app in addition to your password.
                  </AlertDescription>
                </Alert>
                <Button onClick={startSetup} disabled={loading} className="w-full">
                  <Shield className="mr-2 h-4 w-4" />
                  Enable Two-Factor Authentication
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === "setup" && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Authenticator App</CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCode && (
              <div className="flex flex-col items-center space-y-4">
                <img src={qrCode} alt="MFA QR Code" className="w-64 h-64" />
                <div className="w-full">
                  <Label>Manual Entry Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={secret} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        toast.success("Secret copied to clipboard");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="w-full">
                  <Label htmlFor="verification-code">Enter Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={() => setStep("status")} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={enableMFA} disabled={loading} className="flex-1">
                    Verify & Enable
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "enable" && (
        <Dialog open={true} onOpenChange={() => {
          setStep("status");
          if (onClose) onClose();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                MFA Enabled Successfully!
              </DialogTitle>
              <DialogDescription>
                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> These codes will only be shown once. Store them securely.
                </AlertDescription>
              </Alert>
              <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-1">
                {backupCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={copyBackupCodes}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Codes
              </Button>
              <Button onClick={() => {
                setStep("status");
                if (onClose) onClose();
              }}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {step === "disable" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5" />
              Disable Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Enter your password to disable MFA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Disabling MFA will make your account less secure.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("status")} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={disableMFA} disabled={loading} className="flex-1">
                Disable MFA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
