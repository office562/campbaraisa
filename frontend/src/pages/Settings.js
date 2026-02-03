import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Key,
  Mail,
  MessageSquare,
  Zap,
  Save,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  User,
  Users,
  Shield,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Undo2,
  Lock
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TEMPLATE_TRIGGERS = [
  { value: 'none', label: 'None (Manual Only)' },
  { value: 'status_accepted', label: '⚡ Status: Accepted' },
  { value: 'status_paid_in_full', label: '⚡ Status: Paid in Full' },
  { value: 'invoice_sent', label: '⚡ Invoice Sent' },
  { value: 'payment_received', label: '⚡ Payment Received' },
  { value: 'reminder_15_before', label: '⚡ Reminder: 15 days before due' },
  { value: 'reminder_due_date', label: '⚡ Reminder: On due date' },
  { value: 'reminder_3_after', label: '⚡ Reminder: 3 days after due' },
  { value: 'reminder_7_after', label: '⚡ Reminder: 7 days after due' },
  { value: 'reminder_15_after', label: '⚡ Reminder: 15 days after due' },
];

const MERGE_FIELDS = [
  { field: '{{camper_first_name}}', description: 'Camper first name' },
  { field: '{{camper_last_name}}', description: 'Camper last name' },
  { field: '{{camper_full_name}}', description: 'Camper full name' },
  { field: '{{parent_father_first_name}}', description: 'Father first name' },
  { field: '{{parent_father_last_name}}', description: 'Father last name' },
  { field: '{{parent_email}}', description: 'Parent email' },
  { field: '{{payment_link}}', description: 'Portal payment link' },
  { field: '{{amount_due}}', description: 'Amount due' },
  { field: '{{total_balance}}', description: 'Total balance' },
];

function Settings() {
  const { token, admin, updateAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  
  // Account settings
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Admin management
  const [admins, setAdmins] = useState([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', phone: '', role: 'admin' });
  const [editingAdmin, setEditingAdmin] = useState(null);
  
  // Trash
  const [trash, setTrash] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  
  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    template_type: 'email',
    trigger: 'none',
    subject: '',
    body: ''
  });
  
  // API Keys
  const [apiKeys, setApiKeys] = useState({
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    twilio_enabled: false,
    gmail_client_id: '',
    gmail_client_secret: '',
    gmail_enabled: false,
    resend_api_key: '',
    resend_enabled: false,
    email_provider: 'none',
    stripe_api_key: '',
    jotform_api_key: ''
  });
  const [showKeys, setShowKeys] = useState({});

  useEffect(() => {
    if (admin) {
      setAccountForm({
        name: admin.name || '',
        email: admin.email || '',
        phone: admin.phone || ''
      });
    }
    fetchData();
  }, [admin, token]);

  const fetchData = async () => {
    try {
      const [templatesRes, adminsRes, settingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/email-templates`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` }}).catch(() => ({ data: {} }))
      ]);
      setTemplates(templatesRes.data || []);
      setAdmins(adminsRes.data || []);
      if (settingsRes.data) {
        setApiKeys({
          twilio_account_sid: settingsRes.data.twilio_account_sid || '',
          twilio_auth_token: settingsRes.data.twilio_auth_token || '',
          twilio_phone_number: settingsRes.data.twilio_phone_number || '',
          gmail_client_id: settingsRes.data.gmail_client_id || '',
          gmail_client_secret: settingsRes.data.gmail_client_secret || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings data');
    }
  };

  const fetchTrash = async () => {
    setLoadingTrash(true);
    try {
      const res = await axios.get(`${API_URL}/api/campers/trash/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrash(res.data || []);
    } catch (error) {
      toast.error('Failed to load trash');
    } finally {
      setLoadingTrash(false);
    }
  };

  // Account handlers
  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      await axios.put(`${API_URL}/api/account`, accountForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (updateAdmin) {
        updateAdmin({ ...admin, ...accountForm });
      }
      toast.success('Account updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await axios.put(`${API_URL}/api/account/password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  // Admin handlers
  const handleCreateAdmin = async () => {
    try {
      await axios.post(`${API_URL}/api/admins`, newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewAdmin({ name: '', email: '', password: '', phone: '', role: 'admin' });
      setShowAddAdmin(false);
      fetchData();
      toast.success('Admin created');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create admin');
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;
    try {
      await axios.put(`${API_URL}/api/admins/${editingAdmin.id}`, {
        name: editingAdmin.name,
        email: editingAdmin.email,
        phone: editingAdmin.phone,
        role: editingAdmin.role,
        is_approved: editingAdmin.is_approved
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingAdmin(null);
      fetchData();
      toast.success('Admin updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update admin');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await axios.delete(`${API_URL}/api/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      toast.success('Admin deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete admin');
    }
  };

  const handleApproveAdmin = async (adminId) => {
    try {
      await axios.post(`${API_URL}/api/auth/approve/${adminId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      toast.success('Admin approved');
    } catch (error) {
      toast.error('Failed to approve admin');
    }
  };

  const handleDenyAdmin = async (adminId) => {
    try {
      await axios.post(`${API_URL}/api/auth/deny/${adminId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      toast.success('Admin denied');
    } catch (error) {
      toast.error('Failed to deny admin');
    }
  };

  // Trash handlers
  const handleRestoreCamper = async (camperId) => {
    try {
      await axios.post(`${API_URL}/api/campers/trash/${camperId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTrash();
      toast.success('Camper restored');
    } catch (error) {
      toast.error('Failed to restore camper');
    }
  };

  const handlePermanentDelete = async (camperId) => {
    if (!window.confirm('This will permanently delete the camper. This cannot be undone. Continue?')) return;
    try {
      await axios.delete(`${API_URL}/api/campers/trash/${camperId}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTrash();
      toast.success('Camper permanently deleted');
    } catch (error) {
      toast.error('Failed to delete camper');
    }
  };

  // Template handlers
  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await axios.put(`${API_URL}/api/email-templates/${editingTemplate.id}`, templateForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template updated');
      } else {
        await axios.post(`${API_URL}/api/email-templates`, templateForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template created');
      }
      setShowTemplateEditor(false);
      setEditingTemplate(null);
      setTemplateForm({ name: '', template_type: 'email', trigger: 'none', subject: '', body: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await axios.delete(`${API_URL}/api/email-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const openTemplateEditor = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        name: template.name,
        template_type: template.template_type,
        trigger: template.trigger || 'none',
        subject: template.subject || '',
        body: template.body || ''
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({ name: '', template_type: 'email', trigger: 'none', subject: '', body: '' });
    }
    setShowTemplateEditor(true);
  };

  // API Keys handlers
  const handleSaveApiKeys = async () => {
    try {
      await axios.put(`${API_URL}/api/settings`, apiKeys, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('API keys saved');
    } catch (error) {
      toast.error('Failed to save API keys');
    }
  };

  const pendingAdmins = admins.filter(a => !a.is_approved);
  const approvedAdmins = admins.filter(a => a.is_approved);

  return (
    <div data-testid="settings-page">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, team, and system configuration
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="account">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Users className="w-4 h-4 mr-2" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Mail className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="trash" onClick={fetchTrash}>
            <Trash2 className="w-4 h-4 mr-2" />
            Trash
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    data-testid="account-name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    data-testid="account-email"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    data-testid="account-phone"
                  />
                </div>
                <Button 
                  onClick={handleSaveAccount} 
                  className="btn-camp-primary"
                  disabled={savingAccount}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingAccount ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Change Password</CardTitle>
                <CardDescription>Update your login password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={handleChangePassword}
                  variant="outline"
                  disabled={savingPassword}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {savingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins">
          <div className="space-y-6">
            {/* Pending Approvals */}
            {pendingAdmins.length > 0 && (
              <Card className="card-camp border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="font-heading text-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Pending Approvals ({pendingAdmins.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingAdmins.map(a => (
                      <div key={a.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{a.name}</p>
                          <p className="text-sm text-muted-foreground">{a.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => handleApproveAdmin(a.id)}>
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDenyAdmin(a.id)}>
                            <X className="w-4 h-4 mr-1" /> Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin List */}
            <Card className="card-camp">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-xl">Admin Users</CardTitle>
                  <CardDescription>Manage admin accounts</CardDescription>
                </div>
                <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
                  <DialogTrigger asChild>
                    <Button className="btn-camp-primary">
                      <Plus className="w-4 h-4 mr-2" /> Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Admin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name *</Label>
                        <Input value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                      </div>
                      <div>
                        <Label>Password *</Label>
                        <Input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={newAdmin.phone} onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddAdmin(false)}>Cancel</Button>
                      <Button className="btn-camp-primary" onClick={handleCreateAdmin}>Create Admin</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedAdmins.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.email}</TableCell>
                        <TableCell>{a.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {a.id !== admin?.id && (
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setEditingAdmin(a)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteAdmin(a.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {a.id === admin?.id && (
                            <Badge variant="outline">You</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Admin Dialog */}
            <Dialog open={!!editingAdmin} onOpenChange={() => setEditingAdmin(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Admin</DialogTitle>
                </DialogHeader>
                {editingAdmin && (
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={editingAdmin.name} onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={editingAdmin.email} onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={editingAdmin.phone || ''} onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })} />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingAdmin(null)}>Cancel</Button>
                  <Button className="btn-camp-primary" onClick={handleUpdateAdmin}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card className="card-camp">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl">Email/SMS Templates</CardTitle>
                <CardDescription>
                  Create templates with ⚡ to auto-send on status changes
                </CardDescription>
              </div>
              <Button className="btn-camp-primary" onClick={() => openTemplateEditor()}>
                <Plus className="w-4 h-4 mr-2" /> New Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No templates yet. Create your first template.</p>
                ) : (
                  templates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {template.template_type === 'email' ? (
                          <Mail className="w-5 h-5 text-blue-500" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-green-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{template.name}</p>
                            {template.trigger && template.trigger !== 'none' && (
                              <Badge className="bg-amber-100 text-amber-700">
                                <Zap className="w-3 h-3 mr-1" />
                                {TEMPLATE_TRIGGERS.find(t => t.value === template.trigger)?.label?.replace('⚡ ', '') || 'Auto'}
                              </Badge>
                            )}
                          </div>
                          {template.subject && (
                            <p className="text-sm text-muted-foreground truncate max-w-md">{template.subject}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openTemplateEditor(template)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Editor Dialog */}
          <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Template Name *</Label>
                    <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g., Acceptance Email" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={templateForm.template_type} onValueChange={(v) => setTemplateForm({ ...templateForm, template_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Auto-Send Trigger</Label>
                  <Select value={templateForm.trigger} onValueChange={(v) => setTemplateForm({ ...templateForm, trigger: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TRIGGERS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">⚡ triggers will auto-send when the event occurs</p>
                </div>
                {templateForm.template_type === 'email' && (
                  <div>
                    <Label>Subject</Label>
                    <Input value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder="Email subject line" />
                  </div>
                )}
                <div>
                  <Label>Body</Label>
                  <Textarea value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} rows={10} placeholder="Message content..." />
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">Available Merge Fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {MERGE_FIELDS.map(f => (
                      <Badge key={f.field} variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setTemplateForm({ ...templateForm, body: templateForm.body + f.field })} title={f.description}>
                        {f.field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTemplateEditor(false)}>Cancel</Button>
                <Button className="btn-camp-primary" onClick={handleSaveTemplate}>
                  <Save className="w-4 h-4 mr-2" /> Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  Twilio (SMS)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Account SID</Label>
                  <Input value={apiKeys.twilio_account_sid} onChange={(e) => setApiKeys({ ...apiKeys, twilio_account_sid: e.target.value })} placeholder="AC..." />
                </div>
                <div>
                  <Label>Auth Token</Label>
                  <div className="relative">
                    <Input type={showKeys.twilio_auth ? 'text' : 'password'} value={apiKeys.twilio_auth_token} onChange={(e) => setApiKeys({ ...apiKeys, twilio_auth_token: e.target.value })} />
                    <Button variant="ghost" size="sm" className="absolute right-1 top-1" onClick={() => setShowKeys({ ...showKeys, twilio_auth: !showKeys.twilio_auth })}>
                      {showKeys.twilio_auth ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={apiKeys.twilio_phone_number} onChange={(e) => setApiKeys({ ...apiKeys, twilio_phone_number: e.target.value })} placeholder="+1..." />
                </div>
              </CardContent>
            </Card>

            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Mail className="w-5 h-5 text-red-500" />
                  Gmail API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Client ID</Label>
                  <Input value={apiKeys.gmail_client_id} onChange={(e) => setApiKeys({ ...apiKeys, gmail_client_id: e.target.value })} />
                </div>
                <div>
                  <Label>Client Secret</Label>
                  <div className="relative">
                    <Input type={showKeys.gmail_secret ? 'text' : 'password'} value={apiKeys.gmail_client_secret} onChange={(e) => setApiKeys({ ...apiKeys, gmail_client_secret: e.target.value })} />
                    <Button variant="ghost" size="sm" className="absolute right-1 top-1" onClick={() => setShowKeys({ ...showKeys, gmail_secret: !showKeys.gmail_secret })}>
                      {showKeys.gmail_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button className="btn-camp-primary mt-6" onClick={handleSaveApiKeys}>
            <Save className="w-4 h-4 mr-2" /> Save API Keys
          </Button>
        </TabsContent>

        {/* Trash Tab */}
        <TabsContent value="trash">
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Deleted Campers
              </CardTitle>
              <CardDescription>Restore or permanently delete campers</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrash ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E85D04]"></div>
                </div>
              ) : trash.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Trash is empty</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Yeshiva</TableHead>
                      <TableHead>Deleted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trash.map(camper => (
                      <TableRow key={camper.id}>
                        <TableCell className="font-medium">{camper.first_name} {camper.last_name}</TableCell>
                        <TableCell>{camper.yeshiva || '-'}</TableCell>
                        <TableCell>{new Date(camper.deleted_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleRestoreCamper(camper.id)}>
                              <Undo2 className="w-4 h-4 mr-1" /> Restore
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handlePermanentDelete(camper.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Settings;
