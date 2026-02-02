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
  Database, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Search,
  Users,
  DollarSign,
  User,
  ChevronDown,
  ArrowUpDown,
  Settings2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CAMPER_COLUMNS = [
  { key: 'first_name', label: 'First Name', show: true },
  { key: 'last_name', label: 'Last Name', show: true },
  { key: 'grade', label: 'Grade', show: true },
  { key: 'yeshiva', label: 'Yeshiva', show: true },
  { key: 'status', label: 'Status', show: true },
  { key: 'date_of_birth', label: 'Date of Birth', show: false },
  { key: 'city', label: 'City', show: false },
  { key: 'state', label: 'State', show: false },
  { key: 'due_date', label: 'Due Date', show: false },
];

const PARENT_COLUMNS = [
  { key: 'father_first_name', label: 'Father First', show: true },
  { key: 'father_last_name', label: 'Father Last', show: true },
  { key: 'father_cell', label: 'Father Cell', show: true },
  { key: 'mother_first_name', label: 'Mother First', show: true },
  { key: 'mother_cell', label: 'Mother Cell', show: true },
  { key: 'email', label: 'Email', show: true },
];

const DataCenter = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campers');
  const [campers, setCampers] = useState([]);
  const [parents, setParents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCamperCols, setVisibleCamperCols] = useState(
    CAMPER_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: col.show }), {})
  );
  const [visibleParentCols, setVisibleParentCols] = useState(
    PARENT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: col.show }), {})
  );
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campersRes, parentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/campers`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/parents`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setCampers(campersRes.data);
      setParents(parentsRes.data);
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

  const getFilteredData = () => {
    let data = activeTab === 'campers' ? [...campers] : [...parents];
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(item => 
        Object.values(item).some(val => 
          String(val || '').toLowerCase().includes(q)
        )
      );
    }
    
    // Status filter (campers only)
    if (activeTab === 'campers' && statusFilter !== 'all') {
      data = data.filter(item => item.status === statusFilter);
    }
    
    // Sort
    if (sortKey) {
      data.sort((a, b) => {
        const aVal = String(a[sortKey] || '');
        const bVal = String(b[sortKey] || '');
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    
    return data;
  };

  const exportCSV = () => {
    const data = getFilteredData();
    const columns = activeTab === 'campers' ? CAMPER_COLUMNS : PARENT_COLUMNS;
    const visibleCols = activeTab === 'campers' ? visibleCamperCols : visibleParentCols;
    
    const headers = columns.filter(c => visibleCols[c.key]).map(c => c.label);
    const rows = data.map(item => 
      columns.filter(c => visibleCols[c.key]).map(c => `"${String(item[c.key] || '').replace(/"/g, '""')}"`)
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

  const filteredData = getFilteredData();
  const columns = activeTab === 'campers' ? CAMPER_COLUMNS : PARENT_COLUMNS;
  const visibleCols = activeTab === 'campers' ? visibleCamperCols : visibleParentCols;

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
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Data Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Pull reports, customize views, and export data
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('PDF export coming soon')}>
              <FileText className="w-4 h-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="campers" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Campers
          </TabsTrigger>
          <TabsTrigger value="parents" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Parents
          </TabsTrigger>
        </TabsList>

        <Card className="card-camp">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {activeTab === 'campers' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter status" />
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {columns.map(col => (
                    <div key={col.key} className="flex items-center px-2 py-1.5">
                      <Checkbox
                        id={col.key}
                        checked={visibleCols[col.key]}
                        onCheckedChange={() => {
                          if (activeTab === 'campers') {
                            setVisibleCamperCols(prev => ({ ...prev, [col.key]: !prev[col.key] }));
                          } else {
                            setVisibleParentCols(prev => ({ ...prev, [col.key]: !prev[col.key] }));
                          }
                        }}
                      />
                      <Label htmlFor={col.key} className="ml-2 text-sm cursor-pointer">
                        {col.label}
                      </Label>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{filteredData.length} records</p>
          </CardContent>
        </Card>

        <Card className="card-camp">
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {columns.filter(c => visibleCols[c.key]).map(col => (
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
                    {filteredData.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (activeTab === 'campers') navigate(`/campers/${item.id}`);
                        }}
                      >
                        {columns.filter(c => visibleCols[c.key]).map(col => (
                          <td key={col.key} className="p-3 text-sm">
                            {col.key === 'status' ? (
                              <Badge className={
                                item.status === 'Paid in Full' ? 'bg-emerald-100 text-emerald-800' :
                                item.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {item.status}
                              </Badge>
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
    </div>
  );
};

export default DataCenter;
