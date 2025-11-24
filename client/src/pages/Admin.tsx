import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MFASetup } from "@/components/MFASetup";
import { SalesforceSetupTab } from "@/components/SalesforceSetupTab";
import { toast } from "sonner";
import { LogOut, Users, FileText, Settings, CheckCircle2, XCircle, Clock, Shield, Cloud } from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastSignedIn: string | null;
  createdAt: string;
}

interface Submission {
  id: number;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactPosition: string | null;
  companyName: string;
  status: "success" | "failed" | "pending";
  errorMessage: string | null;
  createdAt: string;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      setLocation("/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    setCurrentUser(parsedUser);

    if (parsedUser.role !== "admin") {
      toast.error("Admin access required");
      setLocation("/addin");
      return;
    }

    loadUsers();
    loadSubmissions();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Load users error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/submissions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } else {
        toast.error("Failed to load submissions");
      }
    } catch (error) {
      console.error("Load submissions error:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    setLocation("/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500">Admin</Badge>;
      case "operator":
        return <Badge className="bg-blue-500">Operator</Badge>;
      case "readonly":
        return <Badge variant="secondary">Read Only</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SF Connect Admin</h1>
              <p className="text-sm text-gray-600">Welcome, {currentUser?.name || currentUser?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="salesforce">
              <Cloud className="h-4 w-4 mr-2" />
              Salesforce
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                  <p className="text-xs text-muted-foreground">Contact submissions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {submissions.length > 0
                      ? Math.round((submissions.filter((s) => s.status === "success").length / submissions.length) * 100)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Successful submissions</p>
                </CardContent>
              </Card>
            </div>

            {/* Submissions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>Contact submission history and status</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubmissions ? (
                  <p className="text-center py-4 text-gray-500">Loading submissions...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.slice(0, 20).map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.contactName}</TableCell>
                          <TableCell>{submission.contactEmail || "-"}</TableCell>
                          <TableCell>{submission.companyName}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell>{new Date(submission.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p className="text-center py-4 text-gray-500">Loading users...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>MFA</TableHead>
                        <TableHead>Last Sign In</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.name || "-"}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {user.mfaEnabled ? (
                              <Badge className="bg-green-500"><Shield className="h-3 w-3 mr-1" />Enabled</Badge>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <MFASetup />
          </TabsContent>

          <TabsContent value="salesforce" className="space-y-6">
            <SalesforceSetupTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
