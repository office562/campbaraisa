import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Database, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Filter,
  Search,
  Users,
  DollarSign,
  User,
  Save,
  Folder,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Trash2,
  Settings2,
  Image as ImageIcon
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Column configurations for different report types
const REPORT_CONFIGS = {
  campers: {
    label: 'Campers',
    icon: User,
    columns: [
      { key: 'first_name', label: 'First Name', default: true },
      { key: 'last_name', label: 'Last Name', default: true },
      { key: 'grade', label: 'Grade', default: true },
      { key: 'yeshiva', label: 'Yeshiva', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'date_of_birth', label: 'Date of Birth', default: false },
      { key: 'address', label: 'Address', default: false },
      { key: 'city', label: 'City', default: false },
      { key: 'state', label: 'State', default: false },
      { key: 'zip_code', label: 'Zip Code', default: false },
      { key: 'menahel', label: 'Menahel', default: false },
      { key: 'rebbe_name', label: 'Rebbe Name', default: false },
      { key: 'rebbe_phone', label: 'Rebbe Phone', default: false },
      { key: 'emergency_contact_name', label: 'Emergency Contact', default: false },
      { key: 'emergency_contact_phone', label: 'Emergency Phone', default: false },
      { key: 'allergies', label: 'Allergies', default: false },
      { key: 'medical_info', label: 'Medical Info', default: false },
      { key: 'due_date', label: 'Due Date', default: false },
      { key: 'photo_url', label: 'Photo', default: false },
      { key: 'room', label: 'Room', default: false },
    ]
  },
  parents: {
    label: 'Parents',
    icon: Users,
    columns: [
      { key: 'father_title', label: 'Father Title', default: false },
      { key: 'father_first_name', label: 'Father First', default: true },
      { key: 'father_last_name', label: 'Father Last', default: true },
      { key: 'father_cell', label: 'Father Cell', default: true },
      { key: 'mother_first_name', label: 'Mother First', default: true },
      { key: 'mother_last_name', label: 'Mother Last', default: false },
      { key: 'mother_cell', label: 'Mother Cell', default: true },
      { key: 'email', label: 'Email', default: true },
      { key: 'address', label: 'Address', default: false },
      { key: 'city', label: 'City', default: false },
      { key: 'state', label: 'State', default: false },
      { key: 'zip_code', label: 'Zip', default: false },
      { key: 'total_balance', label: 'Total Balance', default: false },
      { key: 'total_paid', label: 'Total Paid', default: false },
    ]
  },
  payments: {
    label: 'Payments',
    icon: DollarSign,
    columns: [
      { key: 'parent_name', label: 'Parent Name', default: true },
      { key: 'camper_name', label: 'Camper Name', default: true },
      { key: 'amount', label: 'Amount', default: true },
      { key: 'method', label: 'Method', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'created_at', label: 'Date', default: true },
      { key: 'notes', label: 'Notes', default: false },
    ]
  },
  outstanding: {
    label: 'Outstanding Balances',
    icon: DollarSign,
    columns: [
      { key: 'parent_name', label: 'Parent Name', default: true },
      { key: 'email', label: 'Email', default: true },
      { key: 'phone', label: 'Phone', default: true },
      { key: 'camper_names', label: 'Campers', default: true },
      { key: 'total_balance', label: 'Total Balance', default: true },
      { key: 'total_paid', label: 'Total Paid', default: true },
      { key: 'outstanding', label: 'Outstanding', default: true },
    ]
  }
};

const DataCenter = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('campers');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [savedReports, setSavedReports] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // For camper cards export
  const [selectedForExport, setSelectedForExport] = useState([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Initialize visible columns
  useEffect(() => {
    const config = REPORT_CONFIGS[activeReport];
    const initialColumns = {};
    config.columns.forEach(col => {
      initialColumns[col.key] = col.default;
    });
    setVisibleColumns(initialColumns);
  }, [activeReport]);

  // Fetch data based on active report
  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeReport) {
        case 'campers':
          response = await axios.get(`${API_URL}/api/campers`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setData(response.data);
          break;
        case 'parents':
          response = await axios.get(`${API_URL}/api/parents`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setData(response.data);
          break;
        case 'payments':
          response = await axios.get(`${API_URL}/api/payments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Enrich with parent/camper names
          const paymentsData = response.data;
          setData(paymentsData);
          break;
        case 'outstanding':
          // Get parents with outstanding balances
          const parentsRes = await axios.get(`${API_URL}/api/parents`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const campersRes = await axios.get(`${API_URL}/api/campers`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const parentsWithOutstanding = parentsRes.data
            .filter(p => (p.total_balance || 0) > (p.total_paid || 0))
            .map(p => ({
              ...p,
              parent_name: `${p.father_first_name || p.first_name || ''} ${p.father_last_name || p.last_name || ''}`.trim(),
              phone: p.father_cell || p.phone,
              camper_names: campersRes.data
                .filter(c => c.parent_id === p.id)
                .map(c => `${c.first_name} ${c.last_name}`)
                .join(', '),
              outstanding: (p.total_balance || 0) - (p.total_paid || 0)
            }));
          setData(parentsWithOutstanding);
          break;
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeReport, token]);

  // Filter and search data
  useEffect(() => {
    let result = [...data];
    
    // Apply status filter for campers
    if (activeReport === 'campers' && statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(query)
        );
      });
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (sortConfig.direction === 'asc') {
          return String(aVal).localeCompare(String(bVal));
        }
        return String(bVal).localeCompare(String(aVal));
      });
    }
    
    setFilteredData(result);
  }, [data, searchQuery, sortConfig, statusFilter, activeReport]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const exportToCSV = () => {
    const config = REPORT_CONFIGS[activeReport];
    const headers = config.columns
      .filter(col => visibleColumns[col.key])
      .map(col => col.label);
    
    const rows = filteredData.map(item => 
      config.columns
        .filter(col => visibleColumns[col.key])
        .map(col => {
          const val = item[col.key];
          if (col.key === 'photo_url') return val ? 'Yes' : 'No';
          if (typeof val === 'number') return val.toString();
          return `"${String(val || '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleRowClick = (item) => {
    if (activeReport === 'campers') {
      navigate(`/campers/${item.id}`);
    } else if (activeReport === 'parents' || activeReport === 'outstanding') {
      // Navigate to first camper of this parent
      // This would need camper_ids to be stored
    }
  };

  const toggleSelectForExport = (id) => {
    setSelectedForExport(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedForExport.length === filteredData.length) {
      setSelectedForExport([]);
    } else {
      setSelectedForExport(filteredData.map(item => item.id));
    }
  };

  const config = REPORT_CONFIGS[activeReport];
  const visibleColumnsList = config.columns.filter(col => visibleColumns[col.key]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="data-center-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Data Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Pull reports, customize views, and export data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              {activeReport === 'campers' && selectedForExport.length > 0 && (
                <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Export Cards with Photos ({selectedForExport.length})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Report Type Tabs */}
      <Tabs value={activeReport} onValueChange={setActiveReport} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          {Object.entries(REPORT_CONFIGS).map(([key, cfg]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <cfg.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{cfg.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Controls */}
        <Card className="card-camp">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filter (for campers) */}
              {activeReport === 'campers' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Invoice Sent">Invoice Sent</SelectItem>
                    <SelectItem value="Paid in Full">Paid in Full</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {/* Column Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
                  {config.columns.map(col => (
                    <div key={col.key} className="flex items-center px-2 py-1.5">
                      <Checkbox
                        id={col.key}
                        checked={visibleColumns[col.key]}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      <Label htmlFor={col.key} className="ml-2 text-sm cursor-pointer">
                        {col.label}
                      </Label>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>{filteredData.length} records</span>
              {activeReport === 'campers' && (
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedForExport.length === filteredData.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
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
                      {activeReport === 'campers' && (
                        <th className="w-10 p-3">
                          <Checkbox
                            checked={selectedForExport.length === filteredData.length && filteredData.length > 0}
                            onCheckedChange={selectAll}
                          />
                        </th>
                      )}
                      {visibleColumnsList.map(col => (
                        <th
                          key={col.key}
                          className="p-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort(col.key)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(item)}
                        data-testid={`data-row-${item.id || index}`}
                      >
                        {activeReport === 'campers' && (
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedForExport.includes(item.id)}
                              onCheckedChange={() => toggleSelectForExport(item.id)}
                            />
                          </td>
                        )}
                        {visibleColumnsList.map(col => (
                          <td key={col.key} className="p-3 text-sm">
                            {col.key === 'photo_url' ? (
                              item[col.key] ? (
                                <img src={item[col.key]} alt="" className="w-8 h-8 rounded object-cover" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            ) : col.key === 'status' ? (
                              <Badge className={
                                item[col.key] === 'Paid in Full' ? 'bg-emerald-100 text-emerald-800' :
                                item[col.key] === 'Accepted' ? 'bg-green-100 text-green-800' :
                                item[col.key] === 'Applied' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {item[col.key]}
                              </Badge>
                            ) : col.key === 'outstanding' || col.key === 'total_balance' || col.key === 'total_paid' || col.key === 'amount' ? (
                              <span className={col.key === 'outstanding' ? 'text-[#E76F51] font-medium' : ''}>
                                ${(item[col.key] || 0).toLocaleString()}
                              </span>
                            ) : col.key === 'created_at' ? (
                              new Date(item[col.key]).toLocaleDateString()
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
            
            {filteredData.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No data found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Export Options</DialogTitle>
            <DialogDescription>
              Choose how you want to export your data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">Selected: {selectedForExport.length > 0 ? `${selectedForExport.length} campers` : 'All visible records'}</p>
              <p className="text-sm text-muted-foreground">
                {activeReport === 'campers' && selectedForExport.length > 0 
                  ? 'Export selected campers with their photos in a card layout'
                  : 'Export all visible data as a formatted document'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={() => {
                exportToCSV();
                setShowExportDialog(false);
              }}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button className="flex-1 btn-camp-primary" onClick={() => {
                toast.info('PDF export coming soon!');
                setShowExportDialog(false);
              }}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataCenter;
