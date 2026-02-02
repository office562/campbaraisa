import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  UserPlus,
  GraduationCap
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GRADES = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const statusColors = {
  'Applied': 'bg-blue-100 text-blue-800',
  'Accepted': 'bg-green-100 text-green-800',
  'Check/Unknown': 'bg-yellow-100 text-yellow-800',
  'Invoice Sent': 'bg-purple-100 text-purple-800',
  'Payment Plan - Request': 'bg-orange-100 text-orange-800',
  'Payment Plan Running': 'bg-teal-100 text-teal-800',
  'Sending Check': 'bg-indigo-100 text-indigo-800',
  'Partial Paid': 'bg-amber-100 text-amber-800',
  'Partial Paid & Committed': 'bg-lime-100 text-lime-800',
  'Paid in Full': 'bg-emerald-100 text-emerald-800',
};

const Campers = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [campers, setCampers] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [showAddParent, setShowAddParent] = useState(false);
  const [showAddCamper, setShowAddCamper] = useState(false);
  const [newParent, setNewParent] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: ''
  });
  const [newCamper, setNewCamper] = useState({
    first_name: '', last_name: '', hebrew_name: '', date_of_birth: '', grade: '', yeshiva: '', parent_id: ''
  });

  const fetchData = async () => {
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

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddParent = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/parents`, newParent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParents([...parents, response.data]);
      setShowAddParent(false);
      setNewParent({ first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '' });
      toast.success('Parent added successfully');
    } catch (error) {
      toast.error('Failed to add parent');
    }
  };

  const handleAddCamper = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/campers`, newCamper, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampers([...campers, response.data]);
      setShowAddCamper(false);
      setNewCamper({ first_name: '', last_name: '', hebrew_name: '', date_of_birth: '', grade: '', yeshiva: '', parent_id: '' });
      toast.success('Camper added successfully');
    } catch (error) {
      toast.error('Failed to add camper');
    }
  };

  const getParentName = (parentId) => {
    const parent = parents.find(p => p.id === parentId);
    return parent ? `${parent.first_name} ${parent.last_name}` : 'Unknown';
  };

  const filteredCampers = campers.filter(camper => {
    const matchesSearch = 
      camper.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camper.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (camper.hebrew_name && camper.hebrew_name.includes(searchTerm));
    
    const matchesGrade = gradeFilter === 'all' || camper.grade === gradeFilter;
    const matchesStatus = statusFilter === 'all' || camper.status === statusFilter;
    
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const grades = [...new Set(campers.map(c => c.grade).filter(Boolean))];
  const yeshivas = [...new Set(campers.map(c => c.yeshiva).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="campers-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Campers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage camper registrations and details
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddParent} onOpenChange={setShowAddParent}>
            <DialogTrigger asChild>
              <Button variant="outline" className="btn-camp-outline" data-testid="add-parent-btn">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Parent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Add New Parent</DialogTitle>
                <DialogDescription>Enter parent/guardian information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddParent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={newParent.first_name}
                      onChange={(e) => setNewParent({...newParent, first_name: e.target.value})}
                      required
                      data-testid="parent-first-name"
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={newParent.last_name}
                      onChange={(e) => setNewParent({...newParent, last_name: e.target.value})}
                      required
                      data-testid="parent-last-name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newParent.email}
                      onChange={(e) => setNewParent({...newParent, email: e.target.value})}
                      required
                      data-testid="parent-email"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newParent.phone}
                      onChange={(e) => setNewParent({...newParent, phone: e.target.value})}
                      data-testid="parent-phone"
                    />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={newParent.address}
                    onChange={(e) => setNewParent({...newParent, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={newParent.city}
                      onChange={(e) => setNewParent({...newParent, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={newParent.state}
                      onChange={(e) => setNewParent({...newParent, state: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input
                      value={newParent.zip_code}
                      onChange={(e) => setNewParent({...newParent, zip_code: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="btn-camp-primary" data-testid="save-parent-btn">
                    Save Parent
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddCamper} onOpenChange={setShowAddCamper}>
            <DialogTrigger asChild>
              <Button className="btn-camp-primary" data-testid="add-camper-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Camper
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Add New Camper</DialogTitle>
                <DialogDescription>Enter camper registration details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCamper} className="space-y-4">
                <div>
                  <Label>Parent/Guardian</Label>
                  <Select
                    value={newCamper.parent_id}
                    onValueChange={(value) => setNewCamper({...newCamper, parent_id: value})}
                  >
                    <SelectTrigger data-testid="camper-parent-select">
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map(parent => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.first_name} {parent.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={newCamper.first_name}
                      onChange={(e) => setNewCamper({...newCamper, first_name: e.target.value})}
                      required
                      data-testid="camper-first-name"
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={newCamper.last_name}
                      onChange={(e) => setNewCamper({...newCamper, last_name: e.target.value})}
                      required
                      data-testid="camper-last-name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hebrew Name</Label>
                    <Input
                      value={newCamper.hebrew_name}
                      onChange={(e) => setNewCamper({...newCamper, hebrew_name: e.target.value})}
                      className="font-hebrew"
                      placeholder="שם עברי"
                      data-testid="camper-hebrew-name"
                    />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={newCamper.date_of_birth}
                      onChange={(e) => setNewCamper({...newCamper, date_of_birth: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Grade</Label>
                    <Select
                      value={newCamper.grade}
                      onValueChange={(value) => setNewCamper({...newCamper, grade: value})}
                    >
                      <SelectTrigger data-testid="camper-grade-select">
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
                    <Label>Yeshiva</Label>
                    <Input
                      value={newCamper.yeshiva}
                      onChange={(e) => setNewCamper({...newCamper, yeshiva: e.target.value})}
                      placeholder="Yeshiva name"
                      data-testid="camper-yeshiva"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="btn-camp-primary" disabled={!newCamper.parent_id} data-testid="save-camper-btn">
                    Save Camper
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-camp mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="camper-search"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[150px]" data-testid="grade-filter">
                <GraduationCap className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADES.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(statusColors).map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="card-camp">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Hebrew Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Yeshiva</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampers.length > 0 ? (
                filteredCampers.map((camper) => (
                  <TableRow key={camper.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {camper.first_name} {camper.last_name}
                    </TableCell>
                    <TableCell className="font-hebrew">
                      {camper.hebrew_name || '-'}
                    </TableCell>
                    <TableCell>{camper.grade || '-'}</TableCell>
                    <TableCell>{camper.yeshiva || '-'}</TableCell>
                    <TableCell>{getParentName(camper.parent_id)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[camper.status] || 'bg-gray-100 text-gray-800'}>
                        {camper.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/campers/${camper.id}`)}
                        data-testid={`view-camper-${camper.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No campers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-2xl font-bold text-[#E85D04]">{campers.length}</p>
          <p className="text-sm text-muted-foreground">Total Campers</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-2xl font-bold text-[#2A9D8F]">{grades.length}</p>
          <p className="text-sm text-muted-foreground">Grades Represented</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-2xl font-bold text-[#F4A261]">{yeshivas.length}</p>
          <p className="text-sm text-muted-foreground">Yeshivas</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-2xl font-bold text-[#264653]">{parents.length}</p>
          <p className="text-sm text-muted-foreground">Families</p>
        </div>
      </div>
    </div>
  );
};

export default Campers;
