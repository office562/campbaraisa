import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { 
  Plus, 
  BedDouble, 
  Users,
  Building,
  UserPlus,
  UserMinus
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Rooms = () => {
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [campers, setCampers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', building: '' });

  const fetchData = async () => {
    try {
      const [roomsRes, campersRes] = await Promise.all([
        axios.get(`${API_URL}/api/rooms`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/campers`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setRooms(roomsRes.data);
      setCampers(campersRes.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/rooms`, {
        ...newRoom,
        capacity: parseInt(newRoom.capacity)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Room added successfully');
      setShowAddRoom(false);
      setNewRoom({ name: '', capacity: '', building: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add room');
    }
  };

  const handleAssignCamper = async (camperId) => {
    if (!selectedRoom) return;
    try {
      await axios.put(
        `${API_URL}/api/rooms/${selectedRoom.id}/assign?camper_id=${camperId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Camper assigned to room');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign camper');
    }
  };

  const handleUnassignCamper = async (roomId, camperId) => {
    try {
      await axios.put(
        `${API_URL}/api/rooms/${roomId}/unassign?camper_id=${camperId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Camper unassigned from room');
      fetchData();
    } catch (error) {
      toast.error('Failed to unassign camper');
    }
  };

  const getCamperName = (camperId) => {
    const camper = campers.find(c => c.id === camperId);
    return camper ? `${camper.first_name} ${camper.last_name}` : 'Unknown';
  };

  const unassignedCampers = campers.filter(c => !c.room);
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalAssigned = rooms.reduce((sum, r) => sum + (r.assigned_campers?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="rooms-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Rooms
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage room assignments for campers
          </p>
        </div>
        <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
          <DialogTrigger asChild>
            <Button className="btn-camp-primary" data-testid="add-room-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Add New Room</DialogTitle>
              <DialogDescription>Create a new room for camper assignments</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <Label>Room Name</Label>
                <Input
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  placeholder="e.g., Room 101"
                  required
                  data-testid="room-name"
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value})}
                  placeholder="Number of beds"
                  required
                  data-testid="room-capacity"
                />
              </div>
              <div>
                <Label>Building (Optional)</Label>
                <Input
                  value={newRoom.building}
                  onChange={(e) => setNewRoom({...newRoom, building: e.target.value})}
                  placeholder="e.g., Main Building"
                  data-testid="room-building"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="btn-camp-primary" data-testid="save-room-btn">
                  Add Room
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">Total Rooms</p>
                <p className="text-3xl font-bold text-[#2D241E] mt-1">{rooms.length}</p>
              </div>
              <BedDouble className="w-8 h-8 text-[#E85D04]/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">Total Capacity</p>
                <p className="text-3xl font-bold text-[#F4A261] mt-1">{totalCapacity}</p>
              </div>
              <Users className="w-8 h-8 text-[#F4A261]/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">Assigned</p>
                <p className="text-3xl font-bold text-[#2A9D8F] mt-1">{totalAssigned}</p>
              </div>
              <UserPlus className="w-8 h-8 text-[#2A9D8F]/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">Unassigned</p>
                <p className="text-3xl font-bold text-[#E76F51] mt-1">{unassignedCampers.length}</p>
              </div>
              <UserMinus className="w-8 h-8 text-[#E76F51]/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const occupancy = room.assigned_campers?.length || 0;
          const occupancyPercent = (occupancy / room.capacity) * 100;
          
          return (
            <Card key={room.id} className="card-camp" data-testid={`room-card-${room.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-xl flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-[#E85D04]" />
                    {room.name}
                  </CardTitle>
                  <Badge variant="outline">
                    {occupancy}/{room.capacity}
                  </Badge>
                </div>
                {room.building && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {room.building}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {/* Occupancy Bar */}
                <div className="mb-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        occupancyPercent >= 100 ? 'bg-[#E76F51]' :
                        occupancyPercent >= 75 ? 'bg-[#E9C46A]' :
                        'bg-[#2A9D8F]'
                      }`}
                      style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Campers */}
                <div className="space-y-2 mb-4">
                  {room.assigned_campers?.map((camperId) => (
                    <div key={camperId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{getCamperName(camperId)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassignCamper(room.id, camperId)}
                        className="text-[#E76F51] hover:text-[#E76F51] hover:bg-[#E76F51]/10"
                        data-testid={`unassign-${camperId}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {(!room.assigned_campers || room.assigned_campers.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-2">No campers assigned</p>
                  )}
                </div>

                {/* Assign Button */}
                <Dialog open={showAssign && selectedRoom?.id === room.id} onOpenChange={(open) => {
                  setShowAssign(open);
                  if (open) setSelectedRoom(room);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={occupancy >= room.capacity}
                      data-testid={`assign-to-${room.id}`}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Camper
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-heading text-2xl">Assign to {room.name}</DialogTitle>
                      <DialogDescription>Select a camper to assign to this room</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {unassignedCampers.length > 0 ? (
                        unassignedCampers.map((camper) => (
                          <div 
                            key={camper.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              handleAssignCamper(camper.id);
                              setShowAssign(false);
                            }}
                            data-testid={`select-camper-${camper.id}`}
                          >
                            <div>
                              <p className="font-medium">{camper.first_name} {camper.last_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {camper.grade || 'No grade'} • {camper.yeshiva || 'No yeshiva'}
                              </p>
                            </div>
                            <UserPlus className="w-5 h-5 text-[#E85D04]" />
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">All campers are assigned</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}

        {rooms.length === 0 && (
          <div className="col-span-full">
            <Card className="card-camp">
              <CardContent className="py-12 text-center text-muted-foreground">
                <BedDouble className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No rooms created yet. Add your first room to get started.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
