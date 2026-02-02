import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Database,
  Plus,
  Save,
  Download,
  FileText,
  Trash2,
  Edit,
  Eye,
  List,
  Filter,
  ArrowUpDown,
  ChevronLeft
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// All available fields organized by category
const ALL_FIELDS = {
  camper: [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip_code', label: 'Zip Code' },
    { key: 'status', label: 'Status' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'photo_url', label: 'Photo URL' },
  ],
  parent: [
    { key: 'parent_email', label: 'Parent Email' },
    { key: 'father_first_name', label: 'Father First Name' },
    { key: 'father_last_name', label: 'Father Last Name' },
    { key: 'father_cell', label: 'Father Cell' },
    { key: 'mother_first_name', label: 'Mother First Name' },
    { key: 'mother_last_name', label: 'Mother Last Name' },
    { key: 'mother_cell', label: 'Mother Cell' },
  ],
  yeshiva: [
    { key: 'yeshiva', label: 'Yeshiva' },
    { key: 'grade', label: 'Grade' },
    { key: 'menahel', label: 'Menahel' },
    { key: 'rebbe_name', label: 'Rebbe Name' },
    { key: 'rebbe_phone', label: 'Rebbe Phone' },
    { key: 'previous_yeshiva', label: 'Previous Yeshiva' },
  ],
  camp: [
    { key: 'camp_2024', label: 'Camp 2024' },
    { key: 'camp_2023', label: 'Camp 2023' },
    { key: 'room_name', label: 'Room' },
  ],
  emergency: [
    { key: 'emergency_contact_name', label: 'Emergency Contact' },
    { key: 'emergency_contact_phone', label: 'Emergency Phone' },
    { key: 'emergency_contact_relationship', label: 'Emergency Relationship' },
  ],
  medical: [
    { key: 'allergies', label: 'Allergies' },
    { key: 'medical_info', label: 'Medical Info' },
  ],
  billing: [
    { key: 'total_balance', label: 'Total Balance' },
    { key: 'total_paid', label: 'Total Paid' },
    { key: 'portal_token', label: 'Portal Token' },
  ],
};

function DataCenter() {
  const { token } = useAuth();
  const [view, setView] = useState('lists'); // 'lists' or 'editor' or 'data'
  const [savedReports, setSavedReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Report editor state
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState({});
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [token]);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedReports(res.data || []);
    } catch (error) {
      console.error('Failed to fetch reports');
    }
  };

  const fetchReportData = async (reportId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveReport(res.data.report);
      setReportData(res.data.data || []);
      setView('data');
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column');
      return;
    }

    try {
      const reportData = {
        name: reportName,
        description: reportDescription,
        columns: selectedColumns,
        filters: Object.keys(filters).length > 0 ? filters : null,
        sort_by: sortBy || null,
        sort_order: sortOrder
      };

      if (isEditing && editingReportId) {
        await axios.put(`${API_URL}/api/reports/${editingReportId}`, reportData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Report updated');
      } else {
        await axios.post(`${API_URL}/api/reports`, reportData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Report saved');
      }

      fetchReports();
      resetEditor();
      setView('lists');
    } catch (error) {
      toast.error('Failed to save report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await axios.delete(`${API_URL}/api/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReports();
      toast.success('Report deleted');
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleEditReport = (report) => {
    setIsEditing(true);
    setEditingReportId(report.id);
    setReportName(report.name);
    setReportDescription(report.description || '');
    setSelectedColumns(report.columns || []);
    setSortBy(report.sort_by || '');
    setSortOrder(report.sort_order || 'asc');
    setFilters(report.filters || {});
    setView('editor');
  };

  const resetEditor = () => {
    setReportName('');
    setReportDescription('');
    setSelectedColumns([]);
    setSortBy('');
    setSortOrder('asc');
    setFilters({});
    setIsEditing(false);
    setEditingReportId(null);
  };

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(c => c !== key));
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const columns = activeReport?.columns || [];
    const headers = columns.join(',');
    const rows = reportData.map(row => 
      columns.map(col => {
        const val = row[col] || '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport?.name || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const getFieldLabel = (key) => {
    for (const category of Object.values(ALL_FIELDS)) {
      const field = category.find(f => f.key === key);
      if (field) return field.label;
    }
    return key;
  };

  // Lists View
  if (view === 'lists') {
    return (
      <div data-testid="data-center-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
              Data Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage custom data lists
            </p>
          </div>
          <Button className="btn-camp-primary" onClick={() => { resetEditor(); setView('editor'); }}>
            <Plus className="w-4 h-4 mr-2" /> New List
          </Button>
        </div>

        {savedReports.length === 0 ? (
          <Card className="card-camp">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Database className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="font-heading text-xl text-muted-foreground mb-2">No Lists Yet</h3>
              <p className="text-muted-foreground mb-6">Create your first custom data list</p>
              <Button className="btn-camp-primary" onClick={() => { resetEditor(); setView('editor'); }}>
                <Plus className="w-4 h-4 mr-2" /> Create List
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedReports.map(report => (
              <Card key={report.id} className="card-camp hover:shadow-lg transition-shadow cursor-pointer" onClick={() => fetchReportData(report.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <List className="w-5 h-5 text-[#E85D04]" />
                      <CardTitle className="font-heading text-lg">{report.name}</CardTitle>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => handleEditReport(report)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteReport(report.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {report.description && (
                    <CardDescription className="mt-1">{report.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {(report.columns || []).slice(0, 5).map(col => (
                      <Badge key={col} variant="outline" className="text-xs">{getFieldLabel(col)}</Badge>
                    ))}
                    {(report.columns || []).length > 5 && (
                      <Badge variant="outline" className="text-xs">+{report.columns.length - 5} more</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Created {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Editor View
  if (view === 'editor') {
    return (
      <div data-testid="data-center-editor">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => { resetEditor(); setView('lists'); }}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
              {isEditing ? 'Edit List' : 'Create New List'}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl">List Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>List Name *</Label>
                  <Input 
                    value={reportName} 
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g., Parent Contact List"
                    data-testid="list-name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input 
                    value={reportDescription} 
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <Label>Sort By</Label>
                  <Select value={sortBy || "none"} onValueChange={(v) => setSortBy(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {selectedColumns.map(col => (
                        <SelectItem key={col} value={col}>{getFieldLabel(col)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {sortBy && (
                  <div>
                    <Label>Sort Order</Label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending (A-Z)</SelectItem>
                        <SelectItem value="desc">Descending (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="btn-camp-primary w-full" onClick={handleSaveReport}>
              <Save className="w-4 h-4 mr-2" /> Save List
            </Button>
          </div>

          {/* Column Selection */}
          <div className="lg:col-span-2">
            <Card className="card-camp">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Select Fields</CardTitle>
                <CardDescription>Choose which fields to include in this list</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {Object.entries(ALL_FIELDS).map(([category, fields]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
                          {category === 'camper' && '👤 Camper Info'}
                          {category === 'parent' && '👪 Parent Info'}
                          {category === 'yeshiva' && '🎓 Yeshiva Info'}
                          {category === 'camp' && '⛺ Camp History'}
                          {category === 'emergency' && '🚨 Emergency Contact'}
                          {category === 'medical' && '💊 Medical Info'}
                          {category === 'billing' && '💰 Billing'}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {fields.map(field => (
                            <div
                              key={field.key}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedColumns.includes(field.key) ? 'bg-[#E85D04]/10 border border-[#E85D04]' : 'bg-gray-50 hover:bg-gray-100'}`}
                              onClick={() => toggleColumn(field.key)}
                            >
                              <Checkbox 
                                checked={selectedColumns.includes(field.key)}
                                onCheckedChange={() => toggleColumn(field.key)}
                              />
                              <span className="text-sm">{field.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Data View
  if (view === 'data') {
    return (
      <div data-testid="data-center-view">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => { setActiveReport(null); setReportData([]); setView('lists'); }}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
                {activeReport?.name}
              </h1>
              {activeReport?.description && (
                <p className="text-muted-foreground mt-1">{activeReport.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleEditReport(activeReport)}>
              <Edit className="w-4 h-4 mr-2" /> Edit List
            </Button>
            <Button className="btn-camp-primary" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="card-camp">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-16">
                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No data found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {(activeReport?.columns || []).map(col => (
                        <TableHead key={col}>{getFieldLabel(col)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row, idx) => (
                      <TableRow key={row.id || idx}>
                        {(activeReport?.columns || []).map(col => (
                          <TableCell key={col}>
                            {col === 'total_balance' || col === 'total_paid' ? (
                              `$${(row[col] || 0).toLocaleString()}`
                            ) : (
                              row[col] || '-'
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              {reportData.length} records
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default DataCenter;
