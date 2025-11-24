import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Key } from "lucide-react";
import { toast } from "sonner";

interface MFAVerificationProps {
  email: string;
  onSuccess: (token: string, user: any) => void;
  onCancel: () => void;
}

export function MFAVerification({ email, onSuccess, onCancel }: MFAVerificationProps) {
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("totp");

  const verifyCode = async (isBackupCode: boolean) => {
    const token = isBackupCode ? backupCode : code;
    
    if (!token) {
      toast.error("Please enter a code");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          isBackupCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification successful!");
        onSuccess(data.token, data.user);
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter the verification code from your authenticator app
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp">
              <Shield className="mr-2 h-4 w-4" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Key className="mr-2 h-4 w-4" />
              Backup Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4">
            <div>
              <Label htmlFor="totp-code">Verification Code</Label>
              <Input
                id="totp-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="mt-1 text-center text-2xl tracking-widest font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    verifyCode(false);
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => verifyCode(false)} disabled={loading || code.length !== 6} className="flex-1">
                Verify
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div>
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                placeholder="XXXXXXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                className="mt-1 text-center font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    verifyCode(true);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Use one of the backup codes you saved when enabling MFA
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => verifyCode(true)} disabled={loading || !backupCode} className="flex-1">
                Verify
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
