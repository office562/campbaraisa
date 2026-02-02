import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Phone,
  Building,
  Link2,
  Save,
  Plus,
  Edit,
  UserCheck,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Settings = () => {
  const { token, admin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '', subject: '', body: '', trigger: ''
  });

  const fetchData = async () => {
    try {
      const [settingsRes, templatesRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/email-templates`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/auth/pending`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setSettings(settingsRes.data);
      setTemplates(templatesRes.data);
      setPendingAdmins(pendingRes.data);
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await axios.put(`${API_URL}/api/email-templates/${editingTemplate.id}`, newTemplate, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template updated');
      } else {
        await axios.post(`${API_URL}/api/email-templates`, newTemplate, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Template created');
      }
      setShowAddTemplate(false);
      setEditingTemplate(null);
      setNewTemplate({ name: '', subject: '', body: '', trigger: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleApproveAdmin = async (adminId) => {
    try {
      await axios.post(`${API_URL}/api/auth/approve/${adminId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve admin');
    }
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      subject: template.subject,
      body: template.body,
      trigger: template.trigger || ''
    });
    setShowAddTemplate(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="settings-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure camp settings and integrations
          </p>
        </div>
        <Button
          onClick={handleSaveSettings}
          className="btn-camp-primary"
          disabled={saving}
          data-testid="save-settings-btn"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 gap-4">
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">Integrations</TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">Email Templates</TabsTrigger>
          <TabsTrigger value="admins" data-testid="tab-admins">Admins</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Building className="w-5 h-5 text-[#E85D04]" />
                Camp Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Camp Name</Label>
                <Input
                  value={settings?.camp_name || ''}
                  onChange={(e) => setSettings({...settings, camp_name: e.target.value})}
                  data-testid="setting-camp-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Camp Email
                  </Label>
                  <Input
                    type="email"
                    value={settings?.camp_email || ''}
                    onChange={(e) => setSettings({...settings, camp_email: e.target.value})}
                    placeholder="info@campbaraisa.com"
                    data-testid="setting-camp-email"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Camp Phone
                  </Label>
                  <Input
                    value={settings?.camp_phone || ''}
                    onChange={(e) => setSettings({...settings, camp_phone: e.target.value})}
                    placeholder="(555) 123-4567"
                    data-testid="setting-camp-phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[#E85D04]" />
                  QuickBooks Integration
                </CardTitle>
                <CardDescription>Sync financial data with QuickBooks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Enable QuickBooks Sync</p>
                    <p className="text-sm text-muted-foreground">Automatically sync invoices and payments</p>
                  </div>
                  <Switch
                    checked={settings?.quickbooks_sync || false}
                    onCheckedChange={(checked) => setSettings({...settings, quickbooks_sync: checked})}
                    data-testid="toggle-quickbooks"
                  />
                </div>
                {settings?.quickbooks_sync && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      QuickBooks API credentials need to be configured. Contact support for setup assistance.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#E85D04]" />
                  Gmail Integration
                </CardTitle>
                <CardDescription>Send emails via Google Workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Gmail API</p>
                    <p className="text-sm text-muted-foreground">Send automated emails through Gmail</p>
                  </div>
                  <Switch
                    checked={settings?.gmail_enabled || false}
                    onCheckedChange={(checked) => setSettings({...settings, gmail_enabled: checked})}
                    data-testid="toggle-gmail"
                  />
                </div>
                {!settings?.gmail_enabled && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Emails are currently queued but not sent. Enable Gmail to send automated communications.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#E85D04]" />
                  Twilio SMS Integration
                </CardTitle>
                <CardDescription>Send SMS notifications to parents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Twilio SMS</p>
                    <p className="text-sm text-muted-foreground">Send text message reminders</p>
                  </div>
                  <Switch
                    checked={settings?.twilio_enabled || false}
                    onCheckedChange={(checked) => setSettings({...settings, twilio_enabled: checked})}
                    data-testid="toggle-twilio"
                  />
                </div>
                {!settings?.twilio_enabled && (
                  <p className="text-sm text-muted-foreground mt-4">
                    SMS is disabled. Configure Twilio credentials to enable text messaging.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="emails">
          <Card className="card-camp">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl">Email Templates</CardTitle>
                <CardDescription>Customize automated email content</CardDescription>
              </div>
              <Dialog open={showAddTemplate} onOpenChange={(open) => {
                setShowAddTemplate(open);
                if (!open) {
                  setEditingTemplate(null);
                  setNewTemplate({ name: '', subject: '', body: '', trigger: '' });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-camp-primary" data-testid="add-template-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl">
                      {editingTemplate ? 'Edit Template' : 'Create Template'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveTemplate} className="space-y-4">
                    <div>
                      <Label>Template Name</Label>
                      <Input
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                        placeholder="e.g., Acceptance Email"
                        required
                        data-testid="template-name"
                      />
                    </div>
                    <div>
                      <Label>Trigger (Optional)</Label>
                      <Input
                        value={newTemplate.trigger}
                        onChange={(e) => setNewTemplate({...newTemplate, trigger: e.target.value})}
                        placeholder="e.g., status_accepted"
                      />
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                        placeholder="Email subject line"
                        required
                        data-testid="template-subject"
                      />
                    </div>
                    <div>
                      <Label>Body</Label>
                      <Textarea
                        value={newTemplate.body}
                        onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                        placeholder="Email content..."
                        rows={8}
                        required
                        data-testid="template-body"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="btn-camp-primary" data-testid="save-template-btn">
                        {editingTemplate ? 'Update Template' : 'Create Template'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {templates.length > 0 ? (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                        {template.trigger && (
                          <Badge variant="outline" className="mt-1">{template.trigger}</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditTemplate(template)}
                        data-testid={`edit-template-${template.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No email templates created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Management */}
        <TabsContent value="admins">
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#E85D04]" />
                Pending Admin Approvals
              </CardTitle>
              <CardDescription>Approve new admin registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAdmins.length > 0 ? (
                <div className="space-y-3">
                  {pendingAdmins.map((pendingAdmin) => (
                    <div key={pendingAdmin.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <p className="font-medium">{pendingAdmin.name}</p>
                        <p className="text-sm text-muted-foreground">{pendingAdmin.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Registered: {new Date(pendingAdmin.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleApproveAdmin(pendingAdmin.id)}
                        className="btn-camp-primary"
                        data-testid={`approve-admin-${pendingAdmin.id}`}
                      >
                        Approve
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No pending admin approvals</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Admin Info */}
          <Card className="card-camp mt-6">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Current Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-[#E85D04]/5 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#E85D04] flex items-center justify-center text-white font-bold text-lg">
                  {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-medium">{admin?.name}</p>
                  <p className="text-sm text-muted-foreground">{admin?.email}</p>
                  <Badge className="mt-1 bg-[#2A9D8F]">Approved</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
