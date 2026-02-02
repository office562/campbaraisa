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
  MapPin,
  GraduationCap,
  Building,
  FileText,
  AlertCircle,
  Tent,
  Calendar,
  Camera,
  MessageSquare
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

function CamperDetail() {
  const { camperId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [camper, setCamper] = useState(null);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(function() {
    async function fetchData() {
      try {
        const camperRes = await axios.get(API_URL + '/api/campers/' + camperId, {
          headers: { Authorization: 'Bearer ' + token }
        });
        setCamper(camperRes.data);

        const parentRes = await axios.get(API_URL + '/api/parents/' + camperRes.data.parent_id, {
          headers: { Authorization: 'Bearer ' + token }
        });
        setParent(parentRes.data);
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
      
      if (newStatus === 'Accepted' || newStatus === 'Paid in Full') {
        toast.info('Automated email has been queued');
      }
    } catch (error) {
      toast.error('Failed to update status');
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
    if (!parent) return '';
    const firstName = parent.father_first_name || parent.first_name || '';
    const lastName = parent.father_last_name || parent.last_name || '';
    return (firstName + ' ' + lastName).trim();
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
          {/* Status Card */}
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Enrollment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
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
              {(camper.status === 'Accepted' || camper.status === 'Paid in Full') && (
                <p className="text-sm text-muted-foreground mt-3">
                  * Status change triggers automated email to parent
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
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
                      <Label>Rebbe's Phone</Label>
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
          {/* Parent Info */}
          {parent && (
            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Parent/Guardian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Father */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Father</p>
                  <p className="font-medium">
                    {parent.father_first_name || parent.first_name} {parent.father_last_name || parent.last_name}
                  </p>
                  {(parent.father_cell || parent.phone) && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <a href={'tel:' + (parent.father_cell || parent.phone)} className="hover:underline">
                        {parent.father_cell || parent.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Mother */}
                {parent.mother_first_name && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Mother</p>
                    <p className="font-medium">
                      {parent.mother_first_name} {parent.mother_last_name}
                    </p>
                    {parent.mother_cell && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <a href={'tel:' + parent.mother_cell} className="hover:underline">
                          {parent.mother_cell}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Email */}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={'mailto:' + parent.email} className="text-[#E85D04] hover:underline">
                    {parent.email}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Summary */}
          {parent && (
            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Balance</span>
                    <span className="font-bold">${(parent.total_balance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-bold text-[#2A9D8F]">${(parent.total_paid || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span className="font-bold text-[#E76F51]">
                      ${((parent.total_balance || 0) - (parent.total_paid || 0)).toLocaleString()}
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
          )}

          {/* Portal Link */}
          {parent && (
            <Card className="card-camp bg-[#E85D04]/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-2">Parent Portal Link</p>
                <div className="bg-white rounded-lg p-3 text-xs break-all border">
                  {window.location.origin}/portal/{parent.access_token}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={function() {
                    navigator.clipboard.writeText(window.location.origin + '/portal/' + parent.access_token);
                    toast.success('Link copied to clipboard');
                  }}
                  data-testid="copy-portal-link"
                >
                  Copy Link
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default CamperDetail;
