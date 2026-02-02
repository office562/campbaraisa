import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Plus, 
  BedDouble, 
  Users,
  Building,
  UserPlus,
  UserMinus,
  Bus,
  GraduationCap,
  Plane,
  FolderOpen,
  Filter,
  Download,
  ChevronDown,
  Search,
  Save,
  Trash2,
  Edit
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GROUP_TYPES = [
  { value: 'shiur', label: 'Shiur/Class', icon: GraduationCap, color: 'bg-purple-500' },
  { value: 'transportation', label: 'Transportation', icon: Bus, color: 'bg-blue-500' },
  { value: 'trip', label: 'Trip Group', icon: Plane, color: 'bg-green-500' },
  { value: 'room', label: 'Room/Bunk', icon: BedDouble, color: 'bg-orange-500' },
  { value: 'custom', label: 'Custom Group', icon: FolderOpen, color: 'bg-gray-500' },
];

const RoomsAndGroups = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [campers, setCampers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yeshivaFilter, setYeshivaFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [showUngroupedOnly, setShowUngroupedOnly] = useState(false);
  
  // Dialogs
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({ 
    name: '', 
    type: 'shiur', 
    capacity: '', 
    description: '' 
  });

  const fetchData = async () => {
    try {
      const [groupsRes, campersRes] = await Promise.all([
        axios.get(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/campers`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setGroups(groupsRes.data);
      setCampers(campersRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await axios.put(`${API_URL}/api/groups/${editingGroup.id}`, newGroup, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Group updated');
      } else {
        await axios.post(`${API_URL}/api/groups`, {
          ...newGroup,
          capacity: newGroup.capacity ? parseInt(newGroup.capacity) : null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Group created');
      }
      setShowAddGroup(false);
      setEditingGroup(null);
      setNewGroup({ name: '', type: 'shiur', capacity: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Group deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleAssignCamper = async (camperId) => {
    if (!selectedGroup) return;
    try {
      await axios.put(
        `${API_URL}/api/groups/${selectedGroup.id}/assign?camper_id=${camperId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Camper assigned');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign camper');
    }
  };

  const handleUnassignCamper = async (groupId, camperId) => {
    try {
      await axios.put(
        `${API_URL}/api/groups/${groupId}/unassign?camper_id=${camperId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Camper removed from group');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove camper');
    }
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setNewGroup({
      name: group.name,
      type: group.type,
      capacity: group.capacity?.toString() || '',
      description: group.description || ''
    });
    setShowAddGroup(true);
  };

  const exportGroup = (group) => {
    const assignedCampers = campers.filter(c => group.assigned_campers?.includes(c.id));
    const csv = [
      ['Name', 'Grade', 'Yeshiva', 'Status'].join(','),
      ...assignedCampers.map(c => 
        [`"${c.first_name} ${c.last_name}"`, c.grade || '', c.yeshiva || '', c.status].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Group exported');
  };

  // Get unique values for filters
  const yeshivas = [...new Set(campers.map(c => c.yeshiva).filter(Boolean))];
  const grades = [...new Set(campers.map(c => c.grade).filter(Boolean))];
  const statuses = [...new Set(campers.map(c => c.status).filter(Boolean))];

  // Filter groups
  const filteredGroups = groups.filter(g => {
    if (typeFilter !== 'all' && g.type !== typeFilter) return false;
    if (searchQuery && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get campers for assignment (with filters)
  const getAssignableCampers = () => {
    let filtered = [...campers];
    
    if (showUngroupedOnly && selectedGroup) {
      // Show campers not in ANY group of this type
      const groupsOfType = groups.filter(g => g.type === selectedGroup.type);
      const assignedIds = groupsOfType.flatMap(g => g.assigned_campers || []);
      filtered = filtered.filter(c => !assignedIds.includes(c.id));
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (yeshivaFilter !== 'all') {
      filtered = filtered.filter(c => c.yeshiva === yeshivaFilter);
    }
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(c => c.grade === gradeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
      );
    }
    
    // Exclude already assigned to this group
    if (selectedGroup) {
      filtered = filtered.filter(c => !selectedGroup.assigned_campers?.includes(c.id));
    }
    
    return filtered;
  };

  const getCamperName = (camperId) => {
    const camper = campers.find(c => c.id === camperId);
    return camper ? `${camper.first_name} ${camper.last_name}` : 'Unknown';
  };

  const getCamperDetails = (camperId) => {
    return campers.find(c => c.id === camperId);
  };

  // Stats
  const totalGroups = groups.length;
  const groupsByType = GROUP_TYPES.reduce((acc, type) => {
    acc[type.value] = groups.filter(g => g.type === type.value).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="rooms-groups-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Rooms & Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize campers into shiurim, trips, transportation, and rooms
          </p>
        </div>
        <Dialog open={showAddGroup} onOpenChange={(open) => {
          setShowAddGroup(open);
          if (!open) {
            setEditingGroup(null);
            setNewGroup({ name: '', type: 'shiur', capacity: '', description: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-camp-primary" data-testid="add-group-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </DialogTitle>
              <DialogDescription>
                Organize campers by shiur, trip, transportation, or custom grouping
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <Label>Group Name *</Label>
                <Input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  placeholder="e.g., Shiur Aleph, Trip 1, Bus A"
                  required
                />
              </div>
              <div>
                <Label>Group Type *</Label>
                <Select
                  value={newGroup.type}
                  onValueChange={(value) => setNewGroup({...newGroup, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacity (Optional)</Label>
                <Input
                  type="number"
                  value={newGroup.capacity}
                  onChange={(e) => setNewGroup({...newGroup, capacity: e.target.value})}
                  placeholder="Max number of campers"
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Input
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="Notes about this group"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="btn-camp-primary">
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats by Type */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {GROUP_TYPES.map(type => (
          <Card key={type.value} className="stat-card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setTypeFilter(typeFilter === type.value ? 'all' : type.value)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                  <type.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{groupsByType[type.value] || 0}</p>
                  <p className="text-xs text-muted-foreground">{type.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="card-camp mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {GROUP_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => {
          const typeConfig = GROUP_TYPES.find(t => t.value === group.type) || GROUP_TYPES[4];
          const TypeIcon = typeConfig.icon;
          const memberCount = group.assigned_campers?.length || 0;
          const isFull = group.capacity && memberCount >= group.capacity;
          
          return (
            <Card key={group.id} className="card-camp" data-testid={`group-card-${group.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${typeConfig.color} flex items-center justify-center`}>
                      <TypeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="font-heading text-lg">{group.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditGroup(group)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportGroup(group)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-2">{group.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {/* Member count */}
                <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Members</span>
                  <Badge variant={isFull ? "destructive" : "secondary"}>
                    {memberCount}{group.capacity ? `/${group.capacity}` : ''}
                  </Badge>
                </div>

                {/* Member list */}
                <ScrollArea className="h-40 mb-4">
                  <div className="space-y-2">
                    {group.assigned_campers?.map((camperId) => {
                      const camper = getCamperDetails(camperId);
                      return (
                        <div key={camperId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group/item">
                          <div 
                            className="flex-1 cursor-pointer hover:text-[#E85D04]"
                            onClick={() => navigate(`/campers/${camperId}`)}
                          >
                            <p className="text-sm font-medium">{getCamperName(camperId)}</p>
                            {camper && (
                              <p className="text-xs text-muted-foreground">
                                {camper.grade} • {camper.yeshiva?.substring(0, 20)}...
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassignCamper(group.id, camperId)}
                            className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                    {(!group.assigned_campers || group.assigned_campers.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                    )}
                  </div>
                </ScrollArea>

                {/* Assign button */}
                <Dialog open={showAssign && selectedGroup?.id === group.id} onOpenChange={(open) => {
                  setShowAssign(open);
                  if (open) setSelectedGroup(group);
                  else {
                    setSelectedGroup(null);
                    setShowUngroupedOnly(false);
                    setStatusFilter('all');
                    setYeshivaFilter('all');
                    setGradeFilter('all');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={isFull}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-2xl">Add to {group.name}</DialogTitle>
                      <DialogDescription>Select campers to add to this {typeConfig.label.toLowerCase()}</DialogDescription>
                    </DialogHeader>
                    
                    {/* Filters for assignment */}
                    <div className="space-y-3 border-b pb-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="ungrouped"
                          checked={showUngroupedOnly}
                          onCheckedChange={setShowUngroupedOnly}
                        />
                        <Label htmlFor="ungrouped" className="text-sm">
                          Show only ungrouped campers (not in any {typeConfig.label.toLowerCase()})
                        </Label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={yeshivaFilter} onValueChange={setYeshivaFilter}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Yeshiva" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Yeshivas</SelectItem>
                            {yeshivas.map(y => <SelectItem key={y} value={y}>{y.substring(0, 25)}...</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={gradeFilter} onValueChange={setGradeFilter}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Grades</SelectItem>
                            {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Camper list */}
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {getAssignableCampers().length > 0 ? (
                          getAssignableCampers().map((camper) => (
                            <div 
                              key={camper.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-[#E85D04]/10 cursor-pointer transition-colors"
                              onClick={() => {
                                handleAssignCamper(camper.id);
                              }}
                            >
                              <div>
                                <p className="font-medium">{camper.first_name} {camper.last_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {camper.grade} • {camper.yeshiva?.substring(0, 30)}...
                                </p>
                                <Badge variant="outline" className="mt-1 text-xs">{camper.status}</Badge>
                              </div>
                              <UserPlus className="w-5 h-5 text-[#E85D04]" />
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No campers match filters
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="col-span-full">
            <Card className="card-camp">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No groups found. Create your first group to organize campers.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsAndGroups;
