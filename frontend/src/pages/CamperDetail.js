import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Phone, 
  Mail,
  GraduationCap,
  FileText,
  AlertCircle,
  Tent,
  Calendar,
  Camera,
  MessageSquare,
  Clock,
  Plus,
  DollarSign,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Edit,
  FileSpreadsheet,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const KANBAN_STATUSES = [
  "Applied",
  "Accepted",
  "Check/Unknown",
  "Invoice Sent",
  "Payment Plan - Request",
  "Payment Plan Running",
  "Sending Check",
  "Partial Paid",
  "Partial Paid & Committed",
  "Paid in Full"
];

const GRADES = ['11th', '12th', '1st yr Bais Medrash', '2nd yr Bais Medrash'];

const ACTIVITY_ICONS = {
  'status_changed': <Edit className="w-4 h-4" />,
  'invoice_created': <DollarSign className="w-4 h-4" />,
  'payment_received': <CheckCircle className="w-4 h-4" />,
  'email_sent': <Mail className="w-4 h-4" />,
  'email_queued': <Send className="w-4 h-4" />,
  'sms_sent': <MessageSquare className="w-4 h-4" />,
  'note_added': <FileText className="w-4 h-4" />,
  'camper_created': <Plus className="w-4 h-4" />,
  'camper_updated': <Edit className="w-4 h-4" />,
  'group_assigned': <Users className="w-4 h-4" />,
};

const ACTIVITY_COLORS = {
  'status_changed': 'bg-blue-100 text-blue-700',
  'invoice_created': 'bg-purple-100 text-purple-700',
  'payment_received': 'bg-green-100 text-green-700',
  'email_sent': 'bg-indigo-100 text-indigo-700',
  'email_queued': 'bg-orange-100 text-orange-700',
  'sms_sent': 'bg-teal-100 text-teal-700',
  'note_added': 'bg-gray-100 text-gray-700',
  'camper_created': 'bg-emerald-100 text-emerald-700',
  'camper_updated': 'bg-amber-100 text-amber-700',
  'group_assigned': 'bg-pink-100 text-pink-700',
};

function CamperDetail() {
  const { camperId } = useParams();
  const navigate = useNavigate();
  const { token, admin } = useAuth();
  const [camper, setCamper] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  useEffect(function() {
    async function fetchData() {
      try {
        const [camperRes, activitiesRes] = await Promise.all([
          axios.get(API_URL + '/api/campers/' + camperId, {
            headers: { Authorization: 'Bearer ' + token }
          }),
          axios.get(API_URL + '/api/activities?entity_type=camper&entity_id=' + camperId, {
            headers: { Authorization: 'Bearer ' + token }
          })
        ]);
        setCamper(camperRes.data);
        setActivities(activitiesRes.data || []);
      } catch (error) {
        toast.error('Failed to fetch camper details');
        navigate('/campers');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [camperId, token, navigate]);

  async function handleSave() {
    setSaving(true);
    try {
      await axios.put(API_URL + '/api/campers/' + camperId, camper, {
        headers: { Authorization: 'Bearer ' + token }
      });
      toast.success('Camper updated successfully');
      // Refresh activities
      const activitiesRes = await axios.get(API_URL + '/api/activities?entity_type=camper&entity_id=' + camperId, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setActivities(activitiesRes.data || []);
    } catch (error) {
      toast.error('Failed to update camper');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await axios.put(API_URL + '/api/campers/' + camperId + '/status?status=' + encodeURIComponent(newStatus), {}, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setCamper({ ...camper, status: newStatus });
      toast.success('Status updated to ' + newStatus);
      
      // Refresh activities
      const activitiesRes = await axios.get(API_URL + '/api/activities?entity_type=camper&entity_id=' + camperId, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setActivities(activitiesRes.data || []);
      
      if (newStatus === 'Accepted' || newStatus === 'Paid in Full') {
        toast.info('Automated email has been queued');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await axios.post(API_URL + '/api/activities/note', {
        entity_type: 'camper',
        entity_id: camperId,
        note: newNote
      }, {
        headers: { Authorization: 'Bearer ' + token }
      });
      toast.success('Note added');
      setNewNote('');
      // Refresh activities
      const activitiesRes = await axios.get(API_URL + '/api/activities?entity_type=camper&entity_id=' + camperId, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setActivities(activitiesRes.data || []);
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  if (!camper) return null;

  const statusColors = {
    'Applied': 'bg-blue-500',
    'Accepted': 'bg-green-500',
    'Check/Unknown': 'bg-yellow-500',
    'Invoice Sent': 'bg-purple-500',
    'Payment Plan - Request': 'bg-orange-500',
    'Payment Plan Running': 'bg-teal-500',
    'Sending Check': 'bg-indigo-500',
    'Partial Paid': 'bg-amber-500',
    'Partial Paid & Committed': 'bg-lime-500',
    'Paid in Full': 'bg-emerald-500',
  };

  function getParentDisplayName() {
    const firstName = camper.father_first_name || '';
    const lastName = camper.father_last_name || '';
    if (firstName || lastName) {
      return (firstName + ' ' + lastName).trim();
    }
    const motherFirst = camper.mother_first_name || '';
    const motherLast = camper.mother_last_name || '';
    return (motherFirst + ' ' + motherLast).trim() || 'No parent info';
  }

  function formatActivityTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + ' min ago';
    if (diffHours < 24) return diffHours + ' hr ago';
    if (diffDays < 7) return diffDays + ' days ago';
    return date.toLocaleDateString();
  }

  function formatActivityMessage(activity) {
    const action = activity.action;
    const details = activity.details || {};
    
    switch(action) {
      case 'status_changed':
        return `Status changed from "${details.old_status || 'Unknown'}" to "${details.new_status || 'Unknown'}"`;
      case 'invoice_created':
        return `Invoice created for $${details.amount?.toLocaleString() || 0}`;
      case 'payment_received':
        return `Payment of $${details.amount?.toLocaleString() || 0} received`;
      case 'email_sent':
        return `Email sent: "${details.subject || 'No subject'}"`;
      case 'email_queued':
        return `Email queued: ${details.type || 'notification'}`;
      case 'sms_sent':
        return 'SMS sent to parent';
      case 'note_added':
        return details.note || 'Note added';
      case 'camper_created':
        return 'Camper profile created';
      case 'camper_updated':
        return 'Camper profile updated';
      case 'group_assigned':
        return `Added to group: ${details.group_name || 'Unknown'}`;
      default:
        return action.replace(/_/g, ' ');
    }
  }

  return (
    <div data-testid="camper-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={function() { navigate('/campers'); }}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            {camper.first_name} {camper.last_name}
          </h1>
          <p className="text-muted-foreground">{camper.yeshiva || 'No yeshiva'} • {camper.grade || 'No grade'}</p>
        </div>
        <Button
          onClick={handleSave}
          className="btn-camp-primary"
          disabled={saving}
          data-testid="save-camper-btn"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Due Date Card */}
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Enrollment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={'w-3 h-3 rounded-full ' + (statusColors[camper.status] || 'bg-gray-500')} />
                  <Select value={camper.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[250px]" data-testid="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KANBAN_STATUSES.map(function(status) {
                        return <SelectItem key={status} value={status}>{status}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#E85D04]" />
                  <Label className="text-sm font-medium">Due Date:</Label>
                  <Input
                    type="date"
                    value={camper.due_date || ''}
                    onChange={function(e) { setCamper({...camper, due_date: e.target.value}); }}
                    className="w-[160px]"
                    data-testid="due-date-input"
                  />
                </div>
              </div>
              {(camper.status === 'Accepted' || camper.status === 'Paid in Full') && (
                <p className="text-sm text-muted-foreground mt-3">
                  * Status change triggers automated email to parent
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="parent">Parent</TabsTrigger>
              <TabsTrigger value="yeshiva">Yeshiva</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card className="card-camp">
                <CardHeader>
                  <CardTitle className="font-heading text-xl flex items-center gap-2">
                    <User className="w-5 h-5 text-[#E85D04]" />
                    Camper Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={camper.first_name || ''}
                        onChange={function(e) { setCamper({...camper, first_name: e.target.value}); }}
                        data-testid="camper-first-name"
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={camper.last_name || ''}
                        onChange={function(e) { setCamper({...camper, last_name: e.target.value}); }}
                        data-testid="camper-last-name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={camper.address || ''}
                      onChange={function(e) { setCamper({...camper, address: e.target.value}); }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        value={camper.city || ''}
                        onChange={function(e) { setCamper({...camper, city: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={camper.state || ''}
                        onChange={function(e) { setCamper({...camper, state: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Zip Code</Label>
                      <Input
                        value={camper.zip_code || ''}
                        onChange={function(e) { setCamper({...camper, zip_code: e.target.value}); }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={camper.date_of_birth || ''}
                      onChange={function(e) { setCamper({...camper, date_of_birth: e.target.value}); }}
                    />
                  </div>

                  {/* Camp History */}
                  <div className="border-t pt-4 mt-4">
                    <p className="font-medium mb-3 flex items-center gap-2">
                      <Tent className="w-4 h-4 text-[#E85D04]" />
                      Camp History
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Camp Summer 2024</Label>
                        <Input
                          value={camper.camp_2024 || ''}
                          onChange={function(e) { setCamper({...camper, camp_2024: e.target.value}); }}
                        />
                      </div>
                      <div>
                        <Label>Camp Summer 2023</Label>
                        <Input
                          value={camper.camp_2023 || ''}
                          onChange={function(e) { setCamper({...camper, camp_2023: e.target.value}); }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parent">
              <Card className="card-camp">
                <CardHeader>
                  <CardTitle className="font-heading text-xl flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#E85D04]" />
                    Parent/Guardian Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Parent Email</Label>
                    <Input
                      type="email"
                      value={camper.parent_email || ''}
                      onChange={function(e) { setCamper({...camper, parent_email: e.target.value}); }}
                    />
                  </div>
                  
                  {/* Father */}
                  <div className="border-t pt-4">
                    <p className="font-medium mb-3">Father&apos;s Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input
                          value={camper.father_first_name || ''}
                          onChange={function(e) { setCamper({...camper, father_first_name: e.target.value}); }}
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          value={camper.father_last_name || ''}
                          onChange={function(e) { setCamper({...camper, father_last_name: e.target.value}); }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label>Cell Phone</Label>
                        <Input
                          value={camper.father_cell || ''}
                          onChange={function(e) { setCamper({...camper, father_cell: e.target.value}); }}
                        />
                      </div>
                      <div>
                        <Label>Work Phone</Label>
                        <Input
                          value={camper.father_work_phone || ''}
                          onChange={function(e) { setCamper({...camper, father_work_phone: e.target.value}); }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Mother */}
                  <div className="border-t pt-4">
                    <p className="font-medium mb-3">Mother&apos;s Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input
                          value={camper.mother_first_name || ''}
                          onChange={function(e) { setCamper({...camper, mother_first_name: e.target.value}); }}
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          value={camper.mother_last_name || ''}
                          onChange={function(e) { setCamper({...camper, mother_last_name: e.target.value}); }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label>Cell Phone</Label>
                        <Input
                          value={camper.mother_cell || ''}
                          onChange={function(e) { setCamper({...camper, mother_cell: e.target.value}); }}
                        />
                      </div>
                      <div>
                        <Label>Work Phone</Label>
                        <Input
                          value={camper.mother_work_phone || ''}
                          onChange={function(e) { setCamper({...camper, mother_work_phone: e.target.value}); }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="yeshiva">
              <Card className="card-camp">
                <CardHeader>
                  <CardTitle className="font-heading text-xl flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#E85D04]" />
                    Yeshiva Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Yeshiva</Label>
                      <Input
                        value={camper.yeshiva || ''}
                        onChange={function(e) { setCamper({...camper, yeshiva: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Grade</Label>
                      <Select 
                        value={camper.grade || ''} 
                        onValueChange={function(value) { setCamper({...camper, grade: value}); }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map(function(grade) {
                            return <SelectItem key={grade} value={grade}>{grade}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Menahel</Label>
                      <Input
                        value={camper.menahel || ''}
                        onChange={function(e) { setCamper({...camper, menahel: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Rebbe Name</Label>
                      <Input
                        value={camper.rebbe_name || ''}
                        onChange={function(e) { setCamper({...camper, rebbe_name: e.target.value}); }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Rebbe&apos;s Phone</Label>
                      <Input
                        value={camper.rebbe_phone || ''}
                        onChange={function(e) { setCamper({...camper, rebbe_phone: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Previous Yeshiva</Label>
                      <Input
                        value={camper.previous_yeshiva || ''}
                        onChange={function(e) { setCamper({...camper, previous_yeshiva: e.target.value}); }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emergency">
              <Card className="card-camp">
                <CardHeader>
                  <CardTitle className="font-heading text-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#E85D04]" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={camper.emergency_contact_name || ''}
                        onChange={function(e) { setCamper({...camper, emergency_contact_name: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={camper.emergency_contact_phone || ''}
                        onChange={function(e) { setCamper({...camper, emergency_contact_phone: e.target.value}); }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Relationship to Camper</Label>
                    <Input
                      value={camper.emergency_contact_relationship || ''}
                      onChange={function(e) { setCamper({...camper, emergency_contact_relationship: e.target.value}); }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical">
              <Card className="card-camp">
                <CardHeader>
                  <CardTitle className="font-heading text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#E85D04]" />
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Allergies / Medical Information</Label>
                    <Textarea
                      value={camper.medical_info || camper.allergies || ''}
                      onChange={function(e) { setCamper({...camper, medical_info: e.target.value}); }}
                      placeholder="List any allergies or medical conditions..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={camper.notes || ''}
                      onChange={function(e) { setCamper({...camper, notes: e.target.value}); }}
                      placeholder="Any additional notes..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Photo Card */}
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#E85D04]" />
                Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {camper.photo_url ? (
                <div className="space-y-3">
                  <img 
                    src={camper.photo_url} 
                    alt={camper.first_name + ' ' + camper.last_name}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-[#E85D04] transition-all"
                    onClick={function() { setZoomedPhoto({ url: camper.photo_url, name: camper.first_name + ' ' + camper.last_name }); }}
                  />
                  <div>
                    <Label className="text-xs">Photo URL</Label>
                    <Input
                      value={camper.photo_url || ''}
                      onChange={function(e) { setCamper({...camper, photo_url: e.target.value}); }}
                      placeholder="https://..."
                      className="text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                    <User className="w-12 h-12 text-gray-300" />
                    <p className="text-xs text-muted-foreground mt-2">No photo uploaded</p>
                  </div>
                  <div>
                    <Label className="text-xs">Photo URL</Label>
                    <Input
                      value={camper.photo_url || ''}
                      onChange={function(e) { setCamper({...camper, photo_url: e.target.value}); }}
                      placeholder="Paste image URL here..."
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parent Info Card */}
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Parent Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{getParentDisplayName()}</p>
                {camper.parent_email && (
                  <p className="text-sm text-muted-foreground mt-1">{camper.parent_email}</p>
                )}
                {camper.father_cell && (
                  <p className="text-sm text-muted-foreground">{camper.father_cell}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Summary */}
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Balance</span>
                  <span className="font-bold">${(camper.total_balance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-bold text-[#2A9D8F]">${(camper.total_paid || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className="font-bold text-[#E76F51]">
                    ${((camper.total_balance || 0) - (camper.total_paid || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={function() { navigate('/billing'); }}
                data-testid="view-billing-btn"
              >
                View Full Billing
              </Button>
            </CardContent>
          </Card>

          {/* Portal Link */}
          {camper.portal_token && (
            <Card className="card-camp bg-[#E85D04]/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-2">Parent Portal Link</p>
                <div className="bg-white rounded-lg p-3 text-xs break-all border">
                  {window.location.origin}/portal/{camper.portal_token}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={function() {
                    navigator.clipboard.writeText(window.location.origin + '/portal/' + camper.portal_token);
                    toast.success('Link copied to clipboard');
                  }}
                  data-testid="copy-portal-link"
                >
                  Copy Link
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#E85D04]" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add Note */}
              <div className="mb-4 pb-4 border-b">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={function(e) { setNewNote(e.target.value); }}
                  rows={2}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  className="mt-2 btn-camp-primary"
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {addingNote ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
              
              {/* Activity List */}
              <ScrollArea className="h-[300px] pr-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                ) : (
                  <div className="space-y-4">
                    {activities.map(function(activity) {
                      return (
                        <div key={activity.id} className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ACTIVITY_COLORS[activity.action] || 'bg-gray-100 text-gray-700'}`}>
                            {ACTIVITY_ICONS[activity.action] || <Clock className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{formatActivityMessage(activity)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {formatActivityTime(activity.created_at)}
                              </span>
                              {activity.performed_by_name && (
                                <span className="text-xs text-muted-foreground">
                                  • {activity.performed_by_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CamperDetail;
