import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Database, Download, FileSpreadsheet, FileText, Search, DollarSign, User, ChevronDown, 
  ArrowUpDown, Settings2, Save, Trash2, Calendar
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ALL available columns for campers (including parent/billing info)
const ALL_CAMPER_COLUMNS = [
  // Camper Basic
  { key: 'first_name', label: 'First Name', category: 'basic', default: true },
  { key: 'last_name', label: 'Last Name', category: 'basic', default: true },
  { key: 'grade', label: 'Grade', category: 'basic', default: true },
  { key: 'yeshiva', label: 'Yeshiva', category: 'basic', default: true },
  { key: 'status', label: 'Status', category: 'basic', default: true },
  { key: 'date_of_birth', label: 'Date of Birth', category: 'basic', default: false },
  
  // Address
  { key: 'address', label: 'Address', category: 'address', default: false },
  { key: 'address_line2', label: 'Address Line 2', category: 'address', default: false },
  { key: 'city', label: 'City', category: 'address', default: false },
  { key: 'state', label: 'State', category: 'address', default: false },
  { key: 'zip_code', label: 'Zip Code', category: 'address', default: false },
  
  // Parent Info (embedded)
  { key: 'parent_email', label: 'Parent Email', category: 'parent', default: true },
  { key: 'father_title', label: 'Father Title', category: 'parent', default: false },
  { key: 'father_first_name', label: 'Father First Name', category: 'parent', default: true },
  { key: 'father_last_name', label: 'Father Last Name', category: 'parent', default: true },
  { key: 'father_cell', label: 'Father Cell', category: 'parent', default: true },
  { key: 'father_work_phone', label: 'Father Work', category: 'parent', default: false },
  { key: 'father_occupation', label: 'Father Occupation', category: 'parent', default: false },
  { key: 'mother_title', label: 'Mother Title', category: 'parent', default: false },
  { key: 'mother_first_name', label: 'Mother First Name', category: 'parent', default: false },
  { key: 'mother_last_name', label: 'Mother Last Name', category: 'parent', default: false },
  { key: 'mother_cell', label: 'Mother Cell', category: 'parent', default: true },
  { key: 'mother_work_phone', label: 'Mother Work', category: 'parent', default: false },
  { key: 'mother_occupation', label: 'Mother Occupation', category: 'parent', default: false },
  { key: 'home_phone', label: 'Home Phone', category: 'parent', default: false },
  
  // Yeshiva Details
  { key: 'yeshiva_other', label: 'Yeshiva (Other)', category: 'yeshiva', default: false },
  { key: 'menahel', label: 'Menahel', category: 'yeshiva', default: false },
  { key: 'rebbe_name', label: 'Rebbe Name', category: 'yeshiva', default: false },
  { key: 'rebbe_phone', label: 'Rebbe Phone', category: 'yeshiva', default: false },
  { key: 'previous_yeshiva', label: 'Previous Yeshiva', category: 'yeshiva', default: false },
  
  // Camp History
  { key: 'camp_2024', label: 'Camp 2024', category: 'history', default: false },
  { key: 'camp_2023', label: 'Camp 2023', category: 'history', default: false },
  
  // Medical
  { key: 'allergies', label: 'Allergies', category: 'medical', default: false },
  { key: 'medical_info', label: 'Medical Info', category: 'medical', default: false },
  { key: 'dietary_restrictions', label: 'Dietary Restrictions', category: 'medical', default: false },
  { key: 'medications', label: 'Medications', category: 'medical', default: false },
  { key: 'doctor_name', label: 'Doctor Name', category: 'medical', default: false },
  { key: 'doctor_phone', label: 'Doctor Phone', category: 'medical', default: false },
  { key: 'insurance_company', label: 'Insurance Company', category: 'medical', default: false },
  { key: 'insurance_policy_number', label: 'Policy Number', category: 'medical', default: false },
  
  // Emergency Contact
  { key: 'emergency_contact_name', label: 'Emergency Contact', category: 'emergency', default: false },
  { key: 'emergency_contact_phone', label: 'Emergency Phone', category: 'emergency', default: false },
  { key: 'emergency_contact_relationship', label: 'Relationship', category: 'emergency', default: false },
  
  // Billing
  { key: 'total_balance', label: 'Total Balance', category: 'billing', default: false },
  { key: 'total_paid', label: 'Total Paid', category: 'billing', default: false },
  { key: 'due_date', label: 'Due Date', category: 'billing', default: true },
  { key: 'payment_plan', label: 'Payment Plan', category: 'billing', default: false },
  
  // Groups/Rooms
  { key: 'room_name', label: 'Room', category: 'groups', default: false },
  { key: 'groups', label: 'Groups', category: 'groups', default: false },
  
  // Photo & Notes
  { key: 'photo_url', label: 'Photo', category: 'other', default: false },
  { key: 'notes', label: 'Notes', category: 'other', default: false },
  { key: 'portal_token', label: 'Portal Link', category: 'other', default: false },
];

const INVOICE_COLUMNS = [
  { key: 'camper_name', label: 'Camper', default: true },
  { key: 'description', label: 'Description', default: true },
  { key: 'amount', label: 'Amount', default: true },
  { key: 'paid_amount', label: 'Paid', default: true },
  { key: 'status', label: 'Status', default: true },
  { key: 'due_date', label: 'Due Date', default: true },
  { key: 'next_reminder_date', label: 'Next Reminder', default: false },
  { key: 'created_at', label: 'Created', default: false },
];

const COLUMN_CATEGORIES = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'parent', label: 'Parent Info' },
  { key: 'address', label: 'Address' },
  { key: 'yeshiva', label: 'Yeshiva Details' },
  { key: 'medical', label: 'Medical' },
  { key: 'emergency', label: 'Emergency Contact' },
  { key: 'billing', label: 'Billing' },
  { key: 'history', label: 'Camp History' },
  { key: 'groups', label: 'Groups/Rooms' },
  { key: 'other', label: 'Other' },
];

const DataCenter = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campers');
  const [campers, setCampers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  
  // Column visibility
  const [visibleCamperCols, setVisibleCamperCols] = useState(() => {
    const saved = localStorage.getItem('datacenter_camper_cols');
    if (saved) return JSON.parse(saved);
    return ALL_CAMPER_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: col.default }), {});
  });
  const [visibleInvoiceCols, setVisibleInvoiceCols] = useState(
    INVOICE_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: col.default }), {})
  );

  // Save column prefs
  useEffect(() => {
    localStorage.setItem('datacenter_camper_cols', JSON.stringify(visibleCamperCols));
  }, [visibleCamperCols]);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campersRes, invoicesRes, groupsRes] = await Promise.all([
        axios.get(`${API_URL}/api/campers`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/invoices`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setCampers(campersRes.data);
      setGroups(groupsRes.data);
      
      // Enrich invoices with camper names
      const invoicesEnriched = invoicesRes.data.map(inv => {
        const camper = campersRes.data.find(c => c.id === inv.camper_id);
        return {
          ...inv,
          camper_name: camper ? `${camper.first_name} ${camper.last_name}` : 'Unknown'
        };
      });
      setInvoices(invoicesEnriched);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getFilteredCampers = () => {
    let data = [...campers];
    
    // Enrich with group names
    data = data.map(c => ({
      ...c,
      groups_display: (c.groups || []).map(gid => {
        const g = groups.find(x => x.id === gid);
        return g ? g.name : '';
      }).filter(Boolean).join(', ')
    }));
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(item => 
        Object.values(item).some(val => String(val || '').toLowerCase().includes(q))
      );
    }
    
    if (statusFilter !== 'all') {
      data = data.filter(item => item.status === statusFilter);
    }
    
    if (sortKey) {
      data.sort((a, b) => {
        const aVal = String(a[sortKey] || '');
        const bVal = String(b[sortKey] || '');
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    
    return data;
  };

  const getFilteredInvoices = () => {
    let data = [...invoices];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(item => 
        Object.values(item).some(val => String(val || '').toLowerCase().includes(q))
      );
    }
    
    if (statusFilter !== 'all') {
      data = data.filter(item => item.status === statusFilter);
    }
    
    if (sortKey) {
      data.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        return sortDir === 'asc' ? String(aVal || '').localeCompare(String(bVal || '')) : String(bVal || '').localeCompare(String(aVal || ''));
      });
    }
    
    return data;
  };

  const exportCSV = () => {
    let data, columns, visibleCols;
    
    if (activeTab === 'campers') {
      data = getFilteredCampers();
      columns = ALL_CAMPER_COLUMNS;
      visibleCols = visibleCamperCols;
    } else {
      data = getFilteredInvoices();
      columns = INVOICE_COLUMNS;
      visibleCols = visibleInvoiceCols;
    }
    
    const headers = columns.filter(c => visibleCols[c.key]).map(c => c.label);
    const rows = data.map(item => 
      columns.filter(c => visibleCols[c.key]).map(c => {
        let val = item[c.key];
        if (c.key === 'groups') val = item.groups_display;
        if (typeof val === 'number') return val.toString();
        return `"${String(val || '').replace(/"/g, '""')}"`;
      })
    );
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported successfully');
  };

  const toggleAllInCategory = (category, checked) => {
    const updates = {};
    ALL_CAMPER_COLUMNS.filter(c => c.category === category).forEach(c => {
      updates[c.key] = checked;
    });
    setVisibleCamperCols(prev => ({ ...prev, ...updates }));
  };

  const filteredCampers = getFilteredCampers();
  const filteredInvoices = getFilteredInvoices();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="data-center-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">Data Center</h1>
          <p className="text-muted-foreground mt-1">All camper data in one place - click any row for full details</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />Export<ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('PDF export coming soon')}>
              <FileText className="w-4 h-4 mr-2" />Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="campers" className="flex items-center gap-2">
            <User className="w-4 h-4" />Campers ({campers.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* Controls */}
        <Card className="card-camp">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Filter status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {activeTab === 'campers' ? (
                    <>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Invoice Sent">Invoice Sent</SelectItem>
                      <SelectItem value="Paid in Full">Paid in Full</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              
              {/* Column Selector with Categories */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><Settings2 className="w-4 h-4 mr-2" />Columns</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 max-h-96 overflow-y-auto">
                  {activeTab === 'campers' ? (
                    COLUMN_CATEGORIES.map(cat => (
                      <div key={cat.key} className="mb-2">
                        <div className="flex items-center justify-between px-2 py-1 bg-gray-100 font-medium text-sm">
                          <span>{cat.label}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => toggleAllInCategory(cat.key, true)}>All</Button>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => toggleAllInCategory(cat.key, false)}>None</Button>
                          </div>
                        </div>
                        {ALL_CAMPER_COLUMNS.filter(c => c.category === cat.key).map(col => (
                          <div key={col.key} className="flex items-center px-2 py-1">
                            <Checkbox id={col.key} checked={visibleCamperCols[col.key]} onCheckedChange={() => setVisibleCamperCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))} />
                            <Label htmlFor={col.key} className="ml-2 text-sm cursor-pointer">{col.label}</Label>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    INVOICE_COLUMNS.map(col => (
                      <div key={col.key} className="flex items-center px-2 py-1.5">
                        <Checkbox id={col.key} checked={visibleInvoiceCols[col.key]} onCheckedChange={() => setVisibleInvoiceCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))} />
                        <Label htmlFor={col.key} className="ml-2 text-sm cursor-pointer">{col.label}</Label>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {activeTab === 'campers' ? filteredCampers.length : filteredInvoices.length} records • 
              Click any row to view full details
            </p>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="card-camp">
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {(activeTab === 'campers' ? ALL_CAMPER_COLUMNS : INVOICE_COLUMNS)
                        .filter(c => (activeTab === 'campers' ? visibleCamperCols : visibleInvoiceCols)[c.key])
                        .map(col => (
                          <th key={col.key} className="p-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:bg-gray-100" onClick={() => handleSort(col.key)}>
                            <div className="flex items-center gap-1">{col.label}<ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'campers' ? filteredCampers : filteredInvoices).map((item, idx) => (
                      <tr 
                        key={item.id || idx} 
                        className="border-b hover:bg-[#E85D04]/5 cursor-pointer transition-colors"
                        onClick={() => {
                          if (activeTab === 'campers') navigate(`/campers/${item.id}`);
                          else if (item.camper_id) navigate(`/campers/${item.camper_id}`);
                        }}
                      >
                        {(activeTab === 'campers' ? ALL_CAMPER_COLUMNS : INVOICE_COLUMNS)
                          .filter(c => (activeTab === 'campers' ? visibleCamperCols : visibleInvoiceCols)[c.key])
                          .map(col => (
                            <td key={col.key} className="p-3 text-sm max-w-[200px] truncate">
                              {col.key === 'photo_url' ? (
                                item[col.key] ? <img src={item[col.key]} alt="" className="w-8 h-8 rounded object-cover" /> : '-'
                              ) : col.key === 'status' ? (
                                <Badge className={
                                  item.status === 'Paid in Full' || item.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                  item.status === 'Accepted' || item.status === 'partial' ? 'bg-green-100 text-green-800' :
                                  item.status === 'Applied' || item.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }>{item.status}</Badge>
                              ) : col.key === 'groups' ? (
                                item.groups_display || '-'
                              ) : col.key === 'portal_token' ? (
                                item[col.key] ? <span className="text-[#E85D04]">/portal/{item[col.key]}</span> : '-'
                              ) : ['total_balance', 'total_paid', 'amount', 'paid_amount'].includes(col.key) ? (
                                <span className={col.key === 'total_balance' || col.key === 'amount' ? 'font-medium' : 'text-[#2A9D8F]'}>
                                  ${(item[col.key] || 0).toLocaleString()}
                                </span>
                              ) : col.key === 'created_at' || col.key === 'due_date' || col.key === 'next_reminder_date' ? (
                                item[col.key] ? new Date(item[col.key]).toLocaleDateString() : '-'
                              ) : (
                                item[col.key] || '-'
                              )}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            
            {(activeTab === 'campers' ? filteredCampers : filteredInvoices).length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No data found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default DataCenter;
