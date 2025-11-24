import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Download } from "lucide-react";

export function SalesforceSetupTab() {
  const [activeTab, setActiveTab] = useState("auto");

  // Automated Setup State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [securityToken, setSecurityToken] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<any>(null);

  // Manual Setup State
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  const handleAutomatedSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutoLoading(true);
    setAutoResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/setup/salesforce/auto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password,
          securityToken,
          contactEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAutoResult(data);
        toast.success("Salesforce Connected App created successfully!");
      } else {
        toast.error(data.message || "Automated setup failed");
        setAutoResult({ success: false, message: data.message });
      }
    } catch (error) {
      console.error("Automated setup error:", error);
      toast.error("An error occurred during setup");
    } finally {
      setAutoLoading(false);
    }
  };

  const handleManualComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/setup/salesforce/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consumerKey,
          consumerSecret,
          instanceUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Salesforce configuration completed!");
      } else {
        toast.error(data.message || "Failed to complete setup");
      }
    } catch (error) {
      console.error("Manual setup error:", error);
      toast.error("An error occurred during setup");
    } finally {
      setManualLoading(false);
    }
  };

  const handleDownloadSalesforceXML = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/setup/salesforce/download-xml", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "SFConnect.connectedApp";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Salesforce Connected App XML downloaded");
      } else {
        toast.error("Failed to download XML");
      }
    } catch (error) {
      console.error("Download XML error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDownloadOutlookManifest = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/setup/outlook/download-manifest", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sf-connect-manifest.xml";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Outlook Add-in manifest downloaded");
      } else {
        toast.error("Failed to download manifest");
      }
    } catch (error) {
      console.error("Download manifest error:", error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      {/* Outlook Manifest Download */}
      <Card>
        <CardHeader>
          <CardTitle>Outlook Add-in Manifest</CardTitle>
          <CardDescription>
            Download the manifest file to sideload the SF Connect add-in into Outlook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadOutlookManifest} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Outlook Manifest (manifest.xml)
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            The manifest automatically includes your deployment URL. After downloading, follow{" "}
            <a
              href="https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/sideload-outlook-add-ins-for-testing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Microsoft's sideloading guide
            </a>{" "}
            to install the add-in.
          </p>
        </CardContent>
      </Card>

      {/* Salesforce Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Salesforce Integration Setup</CardTitle>
          <CardDescription>
            Configure Salesforce connection for automatic contact syncing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Automated Setup</TabsTrigger>
              <TabsTrigger value="manual">Manual Setup</TabsTrigger>
            </TabsList>

            {/* Automated Setup Tab */}
            <TabsContent value="auto" className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Requirements:</strong> You must be a Salesforce Administrator to use this feature.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleAutomatedSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Salesforce Username</Label>
                  <Input
                    id="username"
                    type="email"
                    placeholder="admin@company.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={autoLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Salesforce Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your Salesforce password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={autoLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityToken">Security Token</Label>
                  <Input
                    id="securityToken"
                    type="text"
                    placeholder="Your Salesforce security token"
                    value={securityToken}
                    onChange={(e) => setSecurityToken(e.target.value)}
                    required
                    disabled={autoLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Get your security token from Salesforce: Setup → My Personal Information → Reset My Security Token
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="admin@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={autoLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={autoLoading}>
                  {autoLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Connected App...
                    </>
                  ) : (
                    "Start Automated Setup"
                  )}
                </Button>
              </form>

              {autoResult && (
                <div className="mt-4">
                  {autoResult.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="ml-2">
                        <div className="space-y-2">
                          <p className="font-semibold text-green-900">Setup Successful!</p>
                          <div className="text-sm text-green-800 whitespace-pre-line">
                            {autoResult.setupInstructions}
                          </div>
                          {autoResult.consumerKey && (
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setConsumerKey(autoResult.consumerKey);
                                  setInstanceUrl(autoResult.instanceUrl);
                                  setActiveTab("manual");
                                }}
                              >
                                Complete Setup with Consumer Secret
                              </Button>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <p className="font-semibold">Setup Failed</p>
                        <p className="text-sm mt-1">{autoResult.message}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Manual Setup Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div>
                <Button variant="outline" size="sm" onClick={handleDownloadSalesforceXML} className="w-full mb-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download Connected App XML Template
                </Button>
                <p className="text-xs text-gray-500">
                  Use this XML template to manually create a Connected App in Salesforce Setup → App Manager
                </p>
              </div>

              <form onSubmit={handleManualComplete} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="consumerKey">Consumer Key</Label>
                  <Input
                    id="consumerKey"
                    type="text"
                    placeholder="Paste your Consumer Key here"
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    required
                    disabled={manualLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consumerSecret">Consumer Secret</Label>
                  <Input
                    id="consumerSecret"
                    type="password"
                    placeholder="Paste your Consumer Secret here"
                    value={consumerSecret}
                    onChange={(e) => setConsumerSecret(e.target.value)}
                    required
                    disabled={manualLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instanceUrl">Instance URL</Label>
                  <Input
                    id="instanceUrl"
                    type="url"
                    placeholder="https://yourinstance.salesforce.com"
                    value={instanceUrl}
                    onChange={(e) => setInstanceUrl(e.target.value)}
                    required
                    disabled={manualLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={manualLoading}>
                  {manualLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Configuration...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
