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
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Building,
  FileText
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

const GRADES = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const CamperDetail = () => {
  const { camperId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [camper, setCamper] = useState(null);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const camperRes = await axios.get(`${API_URL}/api/campers/${camperId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCamper(camperRes.data);

        const parentRes = await axios.get(`${API_URL}/api/parents/${camperRes.data.parent_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setParent(parentRes.data);
      } catch (error) {
        toast.error('Failed to fetch camper details');
        navigate('/campers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [camperId, token, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/campers/${camperId}`, {
        first_name: camper.first_name,
        last_name: camper.last_name,
        hebrew_name: camper.hebrew_name,
        date_of_birth: camper.date_of_birth,
        grade: camper.grade,
        yeshiva: camper.yeshiva,
        allergies: camper.allergies,
        medical_notes: camper.medical_notes,
        notes: camper.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Camper updated successfully');
    } catch (error) {
      toast.error('Failed to update camper');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`${API_URL}/api/campers/${camperId}/status?status=${encodeURIComponent(newStatus)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCamper({ ...camper, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      
      if (newStatus === 'Accepted' || newStatus === 'Paid in Full') {
        toast.info('Automated email has been queued');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

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

  return (
    <div data-testid="camper-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/campers')}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            {camper.first_name} {camper.last_name}
          </h1>
          {camper.hebrew_name && (
            <p className="text-lg text-muted-foreground font-hebrew">{camper.hebrew_name}</p>
          )}
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
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                Enrollment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${statusColors[camper.status]}`} />
                <Select value={camper.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[250px]" data-testid="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
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

          {/* Camper Details */}
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
                    value={camper.first_name}
                    onChange={(e) => setCamper({...camper, first_name: e.target.value})}
                    data-testid="camper-first-name"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={camper.last_name}
                    onChange={(e) => setCamper({...camper, last_name: e.target.value})}
                    data-testid="camper-last-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hebrew Name</Label>
                  <Input
                    value={camper.hebrew_name || ''}
                    onChange={(e) => setCamper({...camper, hebrew_name: e.target.value})}
                    className="font-hebrew"
                    placeholder="שם עברי"
                    data-testid="camper-hebrew-name"
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={camper.date_of_birth || ''}
                    onChange={(e) => setCamper({...camper, date_of_birth: e.target.value})}
                    data-testid="camper-dob"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Grade
                  </Label>
                  <Select
                    value={camper.grade || ''}
                    onValueChange={(value) => setCamper({...camper, grade: value})}
                  >
                    <SelectTrigger data-testid="camper-grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map(grade => (
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Yeshiva
                  </Label>
                  <Input
                    value={camper.yeshiva || ''}
                    onChange={(e) => setCamper({...camper, yeshiva: e.target.value})}
                    data-testid="camper-yeshiva"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Info */}
          <Card className="card-camp">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E85D04]" />
                Medical & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Allergies</Label>
                <Textarea
                  value={camper.allergies || ''}
                  onChange={(e) => setCamper({...camper, allergies: e.target.value})}
                  placeholder="List any allergies..."
                  data-testid="camper-allergies"
                />
              </div>
              <div>
                <Label>Medical Notes</Label>
                <Textarea
                  value={camper.medical_notes || ''}
                  onChange={(e) => setCamper({...camper, medical_notes: e.target.value})}
                  placeholder="Any medical conditions or requirements..."
                  data-testid="camper-medical"
                />
              </div>
              <div>
                <Label>General Notes</Label>
                <Textarea
                  value={camper.notes || ''}
                  onChange={(e) => setCamper({...camper, notes: e.target.value})}
                  placeholder="Additional notes..."
                  data-testid="camper-notes"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parent Info */}
          {parent && (
            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Parent/Guardian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#E85D04]/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#E85D04]" />
                  </div>
                  <div>
                    <p className="font-medium">{parent.first_name} {parent.last_name}</p>
                    <p className="text-sm text-muted-foreground">Parent</p>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${parent.email}`} className="text-[#E85D04] hover:underline">
                      {parent.email}
                    </a>
                  </div>
                  {parent.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${parent.phone}`} className="hover:underline">
                        {parent.phone}
                      </a>
                    </div>
                  )}
                  {parent.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>
                        {parent.address}<br />
                        {parent.city}, {parent.state} {parent.zip_code}
                      </span>
                    </div>
                  )}
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
                    <span className="font-bold">${parent.total_balance?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-bold text-[#2A9D8F]">${parent.total_paid?.toLocaleString() || 0}</span>
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
                  onClick={() => navigate('/billing')}
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
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/portal/${parent.access_token}`);
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
};

export default CamperDetail;
