import React, { useState, useEffect, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  AlertCircle,
  Eye,
  Trash2,
  MessageSquare,
  Code,
  ChevronDown,
  User,
  DollarSign,
  Home,
  Zap,
  Key,
  FileText
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TRIGGER_OPTIONS = [
  { value: '', label: 'No automatic trigger', auto: false },
  { value: 'status_accepted', label: 'When camper is Accepted', auto: true },
  { value: 'status_paid_in_full', label: 'When paid in full', auto: true },
  { value: 'payment_reminder', label: 'Payment reminder (auto)', auto: true },
  { value: 'invoice_sent', label: 'When invoice is sent', auto: true },
  { value: 'manual', label: 'Manual send only', auto: false },
];

const CATEGORY_ICONS = {
  parent: User,
  camper: User,
  billing: DollarSign,
  camp: Home,
};

const Settings = () => {
  const { token, admin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [mergeFields, setMergeFields] = useState({});
  const [campers, setCampers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '', subject: '', body: '', trigger: '', template_type: 'email'
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewCamperId, setPreviewCamperId] = useState('');
  const [activeField, setActiveField] = useState('body');
  
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);

  const fetchData = async () => {
    try {
      const [settingsRes, templatesRes, pendingRes, fieldsRes, campersRes] = await Promise.all([
        axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/email-templates`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/auth/pending`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/template-merge-fields`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/campers`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setSettings(settingsRes.data);
      setTemplates(templatesRes.data);
      setPendingAdmins(pendingRes.data);
      setMergeFields(fieldsRes.data);
      setCampers(campersRes.data);
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
      setNewTemplate({ name: '', subject: '', body: '', trigger: '', template_type: 'email' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await axios.delete(`${API_URL}/api/email-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Template deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handlePreviewTemplate = async () => {
    try {
      const params = new URLSearchParams();
      if (editingTemplate?.id) {
        params.append('template_id', editingTemplate.id);
      } else {
        params.append('custom_subject', newTemplate.subject);
        params.append('custom_body', newTemplate.body);
      }
      if (previewCamperId) {
        params.append('camper_id', previewCamperId);
      }
      
      const response = await axios.post(
        `${API_URL}/api/templates/preview?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setPreviewData(response.data);
      setShowPreview(true);
    } catch (error) {
      toast.error('Failed to preview template');
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
      trigger: template.trigger || '',
      template_type: template.template_type || 'email'
    });
    setShowAddTemplate(true);
  };

  const insertMergeField = (field) => {
    const targetField = activeField;
    const currentValue = newTemplate[targetField] || '';
    
    // Get cursor position if available
    const ref = targetField === 'subject' ? subjectRef : bodyRef;
    const cursorPos = ref.current?.selectionStart || currentValue.length;
    
    const newValue = currentValue.slice(0, cursorPos) + field + currentValue.slice(cursorPos);
    setNewTemplate({ ...newTemplate, [targetField]: newValue });
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
          <TabsTrigger value="emails" data-testid="tab-emails">Templates</TabsTrigger>
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

        {/* Email/SMS Templates */}
        <TabsContent value="emails">
          <Card className="card-camp">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl">Email & SMS Templates</CardTitle>
                <CardDescription>Create templates with dynamic merge fields for personalized communications</CardDescription>
              </div>
              <Dialog open={showAddTemplate} onOpenChange={(open) => {
                setShowAddTemplate(open);
                if (!open) {
                  setEditingTemplate(null);
                  setNewTemplate({ name: '', subject: '', body: '', trigger: '', template_type: 'email' });
                  setPreviewData(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-camp-primary" data-testid="add-template-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl">
                      {editingTemplate ? 'Edit Template' : 'Create Template'}
                    </DialogTitle>
                    <DialogDescription>
                      Use merge fields to personalize your messages. Click on a field to insert it.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSaveTemplate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                          <Label>Type</Label>
                          <Select
                            value={newTemplate.template_type}
                            onValueChange={(value) => setNewTemplate({...newTemplate, template_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  Email
                                </div>
                              </SelectItem>
                              <SelectItem value="sms">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" />
                                  SMS
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Automatic Trigger</Label>
                        <Select
                          value={newTemplate.trigger}
                          onValueChange={(value) => setNewTemplate({...newTemplate, trigger: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select when to send automatically" />
                          </SelectTrigger>
                          <SelectContent>
                            {TRIGGER_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Merge Fields Toolbar */}
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="w-4 h-4 text-[#E85D04]" />
                          <span className="text-sm font-medium">Insert Merge Field</span>
                          <span className="text-xs text-muted-foreground">(Click to add at cursor position)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(mergeFields).map(([category, fields]) => {
                            const IconComponent = CATEGORY_ICONS[category] || Code;
                            return (
                              <Popover key={category}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8">
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-2" align="start">
                                  <ScrollArea className="h-48">
                                    <div className="space-y-1">
                                      {fields.map((f) => (
                                        <Button
                                          key={f.field}
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start text-xs h-auto py-2"
                                          onClick={() => insertMergeField(f.field)}
                                        >
                                          <div className="text-left">
                                            <div className="font-mono text-[#E85D04]">{f.field}</div>
                                            <div className="text-muted-foreground">{f.label}</div>
                                          </div>
                                        </Button>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </PopoverContent>
                              </Popover>
                            );
                          })}
                        </div>
                      </div>

                      {newTemplate.template_type === 'email' && (
                        <div>
                          <Label>Subject Line</Label>
                          <Input
                            ref={subjectRef}
                            value={newTemplate.subject}
                            onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                            onFocus={() => setActiveField('subject')}
                            placeholder="Email subject with {{merge_fields}}"
                            required
                            data-testid="template-subject"
                            className="font-mono text-sm"
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label>{newTemplate.template_type === 'sms' ? 'Message' : 'Body'}</Label>
                        <Textarea
                          ref={bodyRef}
                          value={newTemplate.body}
                          onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                          onFocus={() => setActiveField('body')}
                          placeholder="Write your message with {{merge_fields}}..."
                          rows={newTemplate.template_type === 'sms' ? 4 : 12}
                          required
                          data-testid="template-body"
                          className="font-mono text-sm"
                        />
                        {newTemplate.template_type === 'sms' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {newTemplate.body.length}/160 characters (SMS limit per segment)
                          </p>
                        )}
                      </div>

                      {/* Preview Section */}
                      <div className="border rounded-lg p-4 bg-[#E85D04]/5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-[#E85D04]" />
                            <span className="font-medium">Preview</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={previewCamperId} onValueChange={setPreviewCamperId}>
                              <SelectTrigger className="w-48 h-8">
                                <SelectValue placeholder="Select camper for preview" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Sample Data</SelectItem>
                                {campers.map(c => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.first_name} {c.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handlePreviewTemplate}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                        
                        {previewData && (
                          <div className="bg-white rounded-lg p-4 space-y-2">
                            {newTemplate.template_type === 'email' && (
                              <div>
                                <span className="text-xs text-muted-foreground">Subject:</span>
                                <p className="font-medium">{previewData.subject}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-muted-foreground">
                                {newTemplate.template_type === 'sms' ? 'Message:' : 'Body:'}
                              </span>
                              <div className="whitespace-pre-wrap text-sm mt-1 p-3 bg-gray-50 rounded">
                                {previewData.body}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <DialogFooter className="gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddTemplate(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="btn-camp-primary" data-testid="save-template-btn">
                          {editingTemplate ? 'Update Template' : 'Create Template'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* Filter by type */}
              <Tabs defaultValue="all" className="mb-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="email">
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    SMS
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <TemplateList 
                    templates={templates} 
                    onEdit={openEditTemplate} 
                    onDelete={handleDeleteTemplate}
                  />
                </TabsContent>
                <TabsContent value="email" className="mt-4">
                  <TemplateList 
                    templates={templates.filter(t => t.template_type === 'email' || !t.template_type)} 
                    onEdit={openEditTemplate} 
                    onDelete={handleDeleteTemplate}
                  />
                </TabsContent>
                <TabsContent value="sms" className="mt-4">
                  <TemplateList 
                    templates={templates.filter(t => t.template_type === 'sms')} 
                    onEdit={openEditTemplate} 
                    onDelete={handleDeleteTemplate}
                  />
                </TabsContent>
              </Tabs>
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

// Template List Component
const TemplateList = ({ templates, onEdit, onDelete }) => {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No templates in this category</p>
      </div>
    );
  }

  // Check if template has an auto trigger
  const isAutoTemplate = (trigger) => {
    const opt = TRIGGER_OPTIONS.find(t => t.value === trigger);
    return opt?.auto === true;
  };

  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const hasAutoTrigger = isAutoTemplate(template.trigger);
        return (
          <div key={template.id} className={`flex items-start justify-between p-4 rounded-lg hover:bg-gray-100 transition-colors ${hasAutoTrigger ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {hasAutoTrigger && (
                  <Zap className="w-4 h-4 text-yellow-500" />
                )}
                {template.template_type === 'sms' ? (
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                ) : (
                  <Mail className="w-4 h-4 text-purple-500" />
                )}
                <p className="font-medium">{template.name}</p>
                {hasAutoTrigger && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">AUTO</Badge>
                )}
              </div>
              {template.subject && (
                <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {template.trigger && (
                  <Badge variant="outline" className={`text-xs ${hasAutoTrigger ? 'border-yellow-400 text-yellow-700' : ''}`}>
                    {hasAutoTrigger && <Zap className="w-3 h-3 mr-1" />}
                    {TRIGGER_OPTIONS.find(t => t.value === template.trigger)?.label || template.trigger}
                  </Badge>
                )}
                <Badge 
                  variant="secondary" 
                  className={template.template_type === 'sms' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                >
                  {template.template_type === 'sms' ? 'SMS' : 'Email'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(template)}
                data-testid={`edit-template-${template.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(template.id)}
                data-testid={`delete-template-${template.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Settings;
