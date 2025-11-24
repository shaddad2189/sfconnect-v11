import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useOfficeContext, parseSenderName, extractCompanyFromEmail } from "@/hooks/useOfficeContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus, Building2, Phone } from "lucide-react";

interface Account {
  Id: string;
  Name: string;
}

interface Contact {
  Id: string;
  Name: string;
  Title: string | null;
  Phone: string | null;
  MobilePhone: string | null;
}

export default function AddIn() {
  const [activeTab, setActiveTab] = useState("submit");
  
  // Submit Contact Tab State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Office.js email context
  const emailContext = useOfficeContext();
  
  // Company Contacts Tab State
  const [lookupAccountId, setLookupAccountId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);
  
  // Auto-populate from email context
  const handleImportFromEmail = () => {
    if (!emailContext.isAvailable) {
      toast.error("Email context not available. This feature works only in Outlook Add-in mode.");
      return;
    }
    
    if (!emailContext.senderEmail) {
      toast.error("No email sender found. Please select an email first.");
      return;
    }
    
    // Parse sender name
    const { firstName: parsedFirstName, lastName: parsedLastName } = parseSenderName(emailContext.senderName);
    
    // Set form fields
    setFirstName(parsedFirstName);
    setLastName(parsedLastName);
    setEmail(emailContext.senderEmail);
    
    // Try to extract company from email domain
    const companyName = extractCompanyFromEmail(emailContext.senderEmail);
    if (companyName) {
      // Try to find matching account
      const matchingAccount = accounts.find((acc) => 
        acc.Name.toLowerCase().includes(companyName.toLowerCase())
      );
      
      if (matchingAccount) {
        setSelectedAccountId(matchingAccount.Id);
        toast.success(`Imported contact from email: ${emailContext.senderName}`);
      } else {
        toast.success(`Imported contact from email. Please select company manually.`);
      }
    } else {
      toast.success(`Imported contact from email. Please select company manually.`);
    }
  };

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/salesforce/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      } else {
        toast.error("Failed to load accounts");
      }
    } catch (error) {
      console.error("Load accounts error:", error);
      toast.error("Failed to load accounts");
    }
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId) {
      toast.error("Please select a company");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/salesforce/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          title,
          accountId: selectedAccountId,
          description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Contact submitted successfully!");
        
        // Reset form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setTitle("");
        setDescription("");
        setSelectedAccountId("");
      } else {
        toast.error(data.error || "Failed to submit contact");
      }
    } catch (error) {
      console.error("Submit contact error:", error);
      toast.error("An error occurred while submitting contact");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadContacts = async () => {
    if (!lookupAccountId) {
      toast.error("Please select a company");
      return;
    }

    setLoadingContacts(true);
    setContacts([]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/salesforce/contacts?accountId=${lookupAccountId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const topThree = (data.contacts || []).slice(0, 3);
        setContacts(topThree);
        
        if (topThree.length === 0) {
          toast.info("No contacts found for this company");
        }
      } else {
        toast.error("Failed to load contacts");
      }
    } catch (error) {
      console.error("Load contacts error:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleCall = (phoneNumber: string | null) => {
    if (!phoneNumber) {
      toast.error("No phone number available");
      return;
    }
    
    // In a real Outlook add-in, this would trigger the phone system
    window.open(`tel:${phoneNumber}`);
    toast.success(`Calling ${phoneNumber}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">SF Connect - Outlook Add-in</h1>
          <p className="text-gray-600 mt-1">Manage Salesforce contacts directly from Outlook</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Submit Contact
            </TabsTrigger>
            <TabsTrigger value="lookup" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Contacts
            </TabsTrigger>
          </TabsList>

          {/* Submit Contact Tab */}
          <TabsContent value="submit">
            <Card>
              <CardHeader>
                <CardTitle>Submit New Contact</CardTitle>
                <CardDescription>
                  Add or update a contact in Salesforce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  {/* Import from Email Button */}
                  {emailContext.isAvailable && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-900 mb-2">
                        📧 Email detected: <strong>{emailContext.senderEmail || "No sender"}</strong>
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImportFromEmail}
                        disabled={!emailContext.senderEmail || submitting}
                        className="w-full"
                      >
                        Import Contact from Email
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title/Position</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={submitting}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.Id} value={account.Id}>
                            {account.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Notes</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      disabled={submitting}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Contact"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Contacts Tab */}
          <TabsContent value="lookup">
            <Card>
              <CardHeader>
                <CardTitle>Company Contacts</CardTitle>
                <CardDescription>
                  View top 3 contacts for a selected company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={lookupAccountId} onValueChange={setLookupAccountId} disabled={loadingContacts}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.Id} value={account.Id}>
                            {account.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleLoadContacts} disabled={loadingContacts || !lookupAccountId}>
                    {loadingContacts ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {contacts.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-semibold text-lg">Top 3 Contacts</h3>
                    {contacts.map((contact) => (
                      <Card key={contact.Id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{contact.Name}</h4>
                              {contact.Title && (
                                <p className="text-sm text-gray-600">{contact.Title}</p>
                              )}
                              {(contact.Phone || contact.MobilePhone) && (
                                <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {contact.Phone || contact.MobilePhone}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCall(contact.Phone || contact.MobilePhone)}
                              disabled={!contact.Phone && !contact.MobilePhone}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {!loadingContacts && contacts.length === 0 && lookupAccountId && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No contacts found. Try searching for a company.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
