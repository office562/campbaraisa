import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import { 
  Plus, BedDouble, Users, Building, UserPlus, UserMinus, Bus, GraduationCap, Plane, FolderOpen, 
  Filter, Download, ChevronDown, Search, Trash2, Edit, Home
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GROUP_TYPES = [
  { value: 'shiur', label: 'Shiur/Class', icon: GraduationCap, color: 'bg-purple-500' },
  { value: 'transportation', label: 'Transportation', icon: Bus, color: 'bg-blue-500' },
  { value: 'trip', label: 'Trip Group', icon: Plane, color: 'bg-green-500' },
  { value: 'custom', label: 'Custom Group', icon: FolderOpen, color: 'bg-gray-500' },
];

const RoomsAndGroups = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
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
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [assignType, setAssignType] = useState('room'); // 'room' or 'group'
  
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', building: '' });
  const [newGroup, setNewGroup] = useState({ name: '', type: 'shiur', capacity: '', description: '' });

  const fetchData = async () => {
    try {
      const [roomsRes, groupsRes, campersRes] = await Promise.all([
        axios.get(`${API_URL}/api/rooms`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/campers`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setRooms(roomsRes.data);
      setGroups(groupsRes.data);
      setCampers(campersRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  // Room handlers
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/rooms`, {
        ...newRoom,
        capacity: parseInt(newRoom.capacity)
      }, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Room created');
      setShowAddRoom(false);
      setNewRoom({ name: '', capacity: '', building: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  // Group handlers
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/groups`, {
        ...newGroup,
        capacity: newGroup.capacity ? parseInt(newGroup.capacity) : null
      }, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Group created');
      setShowAddGroup(false);
      setNewGroup({ name: '', type: 'shiur', capacity: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await axios.delete(`${API_URL}/api/rooms/${roomId}`, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Room deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Group deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleAssignCamper = async (camperId) => {
    if (!selectedItem) return;
    const endpoint = assignType === 'room' 
      ? `${API_URL}/api/rooms/${selectedItem.id}/assign?camper_id=${camperId}`
      : `${API_URL}/api/groups/${selectedItem.id}/assign?camper_id=${camperId}`;
    
    try {
      await axios.put(endpoint, {}, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Camper assigned');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign');
    }
  };

  const handleUnassignCamper = async (itemId, camperId, type) => {
    const endpoint = type === 'room'
      ? `${API_URL}/api/rooms/${itemId}/unassign?camper_id=${camperId}`
      : `${API_URL}/api/groups/${itemId}/unassign?camper_id=${camperId}`;
    
    try {
      await axios.put(endpoint, {}, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Camper removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const exportItem = (item, type) => {
    const assigned = campers.filter(c => item.assigned_campers?.includes(c.id));
    const csv = [
      ['Name', 'Grade', 'Yeshiva', 'Status'].join(','),
      ...assigned.map(c => [`"${c.first_name} ${c.last_name}"`, c.grade || '', c.yeshiva || '', c.status].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    toast.success('Exported');
  };

  // Get unique filter values
  const yeshivas = [...new Set(campers.map(c => c.yeshiva).filter(Boolean))];
  const grades = [...new Set(campers.map(c => c.grade).filter(Boolean))];
  const statuses = [...new Set(campers.map(c => c.status).filter(Boolean))];

  // Get assignable campers with filters
  const getAssignableCampers = () => {
    let filtered = [...campers];
    
    if (showUngroupedOnly && selectedItem) {
      if (assignType === 'room') {
        const assignedInRooms = rooms.flatMap(r => r.assigned_campers || []);
        filtered = filtered.filter(c => !assignedInRooms.includes(c.id));
      } else {
        const groupsOfType = groups.filter(g => g.type === selectedItem.type);
        const assignedIds = groupsOfType.flatMap(g => g.assigned_campers || []);
        filtered = filtered.filter(c => !assignedIds.includes(c.id));
      }
    }
    
    if (statusFilter !== 'all') filtered = filtered.filter(c => c.status === statusFilter);
    if (yeshivaFilter !== 'all') filtered = filtered.filter(c => c.yeshiva === yeshivaFilter);
    if (gradeFilter !== 'all') filtered = filtered.filter(c => c.grade === gradeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q));
    }
    
    if (selectedItem) {
      filtered = filtered.filter(c => !selectedItem.assigned_campers?.includes(c.id));
    }
    
    return filtered;
  };

  const getCamperName = (id) => {
    const c = campers.find(x => x.id === id);
    return c ? `${c.first_name} ${c.last_name}` : 'Unknown';
  };

  const getCamper = (id) => campers.find(x => x.id === id);

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
            Assign campers to rooms and organize into groups
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <BedDouble className="w-4 h-4" />
            Rooms ({rooms.length})
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Groups ({groups.length})
          </TabsTrigger>
        </TabsList>

        {/* ==================== ROOMS TAB ==================== */}
        <TabsContent value="rooms" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
              <DialogTrigger asChild>
                <Button className="btn-camp-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl">Create Room</DialogTitle>
                  <DialogDescription>Add a new room/bunk with building and capacity</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveRoom} className="space-y-4">
                  <div>
                    <Label>Room Name *</Label>
                    <Input
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                      placeholder="e.g., Room 101, Bunk A"
                      required
                    />
                  </div>
                  <div>
                    <Label>Building</Label>
                    <Input
                      value={newRoom.building}
                      onChange={(e) => setNewRoom({...newRoom, building: e.target.value})}
                      placeholder="e.g., Main Building, North Wing"
                    />
                  </div>
                  <div>
                    <Label>Capacity (Beds) *</Label>
                    <Input
                      type="number"
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value})}
                      placeholder="Number of beds"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="btn-camp-primary">Create Room</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const memberCount = room.assigned_campers?.length || 0;
              const isFull = memberCount >= room.capacity;
              const fillPercent = Math.min((memberCount / room.capacity) * 100, 100);
              
              return (
                <Card key={room.id} className="card-camp">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#E85D04]/10 flex items-center justify-center">
                          <BedDouble className="w-6 h-6 text-[#E85D04]" />
                        </div>
                        <div>
                          <CardTitle className="font-heading text-lg">{room.name}</CardTitle>
                          {room.building && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {room.building}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><ChevronDown className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportItem(room, 'room')}>
                            <Download className="w-4 h-4 mr-2" />Export CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteRoom(room.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Capacity bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Occupancy</span>
                        <span className={isFull ? 'text-red-600 font-bold' : ''}>{memberCount}/{room.capacity}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isFull ? 'bg-red-500' : 'bg-[#E85D04]'}`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned campers */}
                    <ScrollArea className="h-32 mb-4">
                      <div className="space-y-2">
                        {room.assigned_campers?.map((camperId) => {
                          const c = getCamper(camperId);
                          return (
                            <div key={camperId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                              <div className="cursor-pointer hover:text-[#E85D04]" onClick={() => navigate(`/campers/${camperId}`)}>
                                <p className="text-sm font-medium">{getCamperName(camperId)}</p>
                                {c && <p className="text-xs text-muted-foreground">{c.grade}</p>}
                              </div>
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => handleUnassignCamper(room.id, camperId, 'room')}
                                className="opacity-0 group-hover:opacity-100 text-red-500"
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                        {(!room.assigned_campers || room.assigned_campers.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">No campers assigned</p>
                        )}
                      </div>
                    </ScrollArea>

                    <Button 
                      variant="outline" className="w-full" disabled={isFull}
                      onClick={() => {
                        setSelectedItem(room);
                        setAssignType('room');
                        setShowAssign(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isFull ? 'Room Full' : 'Add Campers'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            
            {rooms.length === 0 && (
              <Card className="col-span-full card-camp">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BedDouble className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No rooms created yet. Add your first room.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ==================== GROUPS TAB ==================== */}
        <TabsContent value="groups" className="space-y-6">
          {/* Group type stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GROUP_TYPES.map(type => {
              const count = groups.filter(g => g.type === type.value).length;
              return (
                <Card key={type.value} className="stat-card cursor-pointer hover:shadow-md"
                  onClick={() => setTypeFilter(typeFilter === type.value ? 'all' : type.value)}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                        <type.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{type.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {GROUP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
              <DialogTrigger asChild>
                <Button className="btn-camp-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl">Create Group</DialogTitle>
                  <DialogDescription>Organize campers by shiur, trip, or transportation</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveGroup} className="space-y-4">
                  <div>
                    <Label>Group Name *</Label>
                    <Input
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                      placeholder="e.g., Shiur Aleph, Trip 1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Type *</Label>
                    <Select value={newGroup.type} onValueChange={(v) => setNewGroup({...newGroup, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GROUP_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex items-center gap-2"><t.icon className="w-4 h-4" />{t.label}</div>
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
                      placeholder="Max members"
                    />
                  </div>
                  <div>
                    <Label>Description (Optional)</Label>
                    <Input
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                      placeholder="Notes"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="btn-camp-primary">Create Group</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups
              .filter(g => typeFilter === 'all' || g.type === typeFilter)
              .map((group) => {
                const typeConfig = GROUP_TYPES.find(t => t.value === group.type) || GROUP_TYPES[3];
                const memberCount = group.assigned_campers?.length || 0;
                const isFull = group.capacity && memberCount >= group.capacity;
                
                return (
                  <Card key={group.id} className="card-camp">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${typeConfig.color} flex items-center justify-center`}>
                            <typeConfig.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="font-heading text-lg">{group.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><ChevronDown className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportItem(group, 'group')}>
                              <Download className="w-4 h-4 mr-2" />Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteGroup(group.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {group.description && <p className="text-sm text-muted-foreground mt-2">{group.description}</p>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">Members</span>
                        <Badge variant={isFull ? "destructive" : "secondary"}>
                          {memberCount}{group.capacity ? `/${group.capacity}` : ''}
                        </Badge>
                      </div>

                      <ScrollArea className="h-32 mb-4">
                        <div className="space-y-2">
                          {group.assigned_campers?.map((camperId) => {
                            const c = getCamper(camperId);
                            return (
                              <div key={camperId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                                <div className="cursor-pointer hover:text-[#E85D04]" onClick={() => navigate(`/campers/${camperId}`)}>
                                  <p className="text-sm font-medium">{getCamperName(camperId)}</p>
                                  {c && <p className="text-xs text-muted-foreground">{c.grade} • {c.yeshiva?.substring(0,20)}...</p>}
                                </div>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => handleUnassignCamper(group.id, camperId, 'group')}
                                  className="opacity-0 group-hover:opacity-100 text-red-500"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                          {(!group.assigned_campers || group.assigned_campers.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-4">No members</p>
                          )}
                        </div>
                      </ScrollArea>

                      <Button 
                        variant="outline" className="w-full" disabled={isFull}
                        onClick={() => {
                          setSelectedItem(group);
                          setAssignType('group');
                          setShowAssign(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />Add Members
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            
            {groups.filter(g => typeFilter === 'all' || g.type === typeFilter).length === 0 && (
              <Card className="col-span-full card-camp">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No groups found. Create your first group.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog - shared for rooms & groups */}
      <Dialog open={showAssign} onOpenChange={(open) => {
        setShowAssign(open);
        if (!open) {
          setSelectedItem(null);
          setShowUngroupedOnly(false);
          setStatusFilter('all');
          setYeshivaFilter('all');
          setGradeFilter('all');
          setSearchQuery('');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Add to {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              Select campers to add to this {assignType === 'room' ? 'room' : 'group'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Filters */}
          <div className="space-y-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <Checkbox id="ungrouped" checked={showUngroupedOnly} onCheckedChange={setShowUngroupedOnly} />
              <Label htmlFor="ungrouped" className="text-sm">Show only unassigned campers</Label>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search campers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={yeshivaFilter} onValueChange={setYeshivaFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Yeshiva" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Yeshivas</SelectItem>
                  {yeshivas.map(y => <SelectItem key={y} value={y}>{y.substring(0,20)}...</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Grade" /></SelectTrigger>
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
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-[#E85D04]/10 cursor-pointer"
                    onClick={() => handleAssignCamper(camper.id)}
                  >
                    <div>
                      <p className="font-medium">{camper.first_name} {camper.last_name}</p>
                      <p className="text-xs text-muted-foreground">{camper.grade} • {camper.yeshiva?.substring(0,25)}...</p>
                      <Badge variant="outline" className="mt-1 text-xs">{camper.status}</Badge>
                    </div>
                    <UserPlus className="w-5 h-5 text-[#E85D04]" />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No campers match filters</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomsAndGroups;
