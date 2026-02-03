import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Folder, 
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  UserPlus,
  Download
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function GroupRow({ group, subgroups, campers, expanded, onToggle, onEdit, onDelete, onAssign, onExport, onAddSubgroup }) {
  const camperCount = (group.camper_ids || []).length;
  
  return (
    <div className="border rounded-lg mb-2">
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {subgroups.length > 0 ? (
            expanded ? <ChevronDown className="w-5 h-5 text-[#E85D04]" /> : <ChevronRight className="w-5 h-5 text-[#E85D04]" />
          ) : <div className="w-5" />}
          {expanded ? <FolderOpen className="w-5 h-5 text-[#E85D04]" /> : <Folder className="w-5 h-5 text-[#E85D04]" />}
          <div>
            <p className="font-medium">{group.name}</p>
            {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Badge variant="secondary" className="bg-[#E85D04]/10 text-[#E85D04]">{camperCount} campers</Badge>
          <Badge variant="outline">{subgroups.length} subgroups</Badge>
          <Button variant="ghost" size="sm" onClick={onAddSubgroup} title="Add Subgroup"><Plus className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onAssign} title="Assign Campers"><UserPlus className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onExport} title="Export"><Download className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-blue-600" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
      {expanded && subgroups.length > 0 && (
        <div className="border-t">
          {subgroups.map(sub => (
            <SubgroupRow 
              key={sub.id} 
              group={sub} 
              campers={campers}
              onEdit={() => onEdit(sub)}
              onDelete={() => onDelete(sub.id)}
              onAssign={() => onAssign(sub)}
              onExport={() => onExport(sub)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubgroupRow({ group, campers, onEdit, onDelete, onAssign, onExport }) {
  const camperCount = (group.camper_ids || []).length;
  return (
    <div className="flex items-center justify-between p-4 pl-12 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <Folder className="w-4 h-4 text-[#F4A261]" />
        <div>
          <p className="font-medium">{group.name}</p>
          {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-[#F4A261]/10 text-[#F4A261]">{camperCount} campers</Badge>
        <Button variant="ghost" size="sm" onClick={onAssign}><UserPlus className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={onExport}><Download className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" className="text-blue-600" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" className="text-red-600" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

export default function Groups() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [campers, setCampers] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddSubgroup, setShowAddSubgroup] = useState(false);
  const [showAssignCampers, setShowAssignCampers] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedParentGroup, setSelectedParentGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCamperIds, setSelectedCamperIds] = useState([]);

  useEffect(function() {
    fetchData();
  }, [token]);

  async function fetchData() {
    try {
      const [groupsRes, campersRes] = await Promise.all([
        axios.get(API_URL + '/api/groups', { headers: { Authorization: 'Bearer ' + token } }),
        axios.get(API_URL + '/api/campers', { headers: { Authorization: 'Bearer ' + token } })
      ]);
      setGroups(groupsRes.data || []);
      setCampers(campersRes.data || []);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    try {
      await axios.post(API_URL + '/api/groups', {
        name: newGroupName,
        description: newGroupDescription,
        parent_id: null
      }, { headers: { Authorization: 'Bearer ' + token } });
      toast.success('Group created');
      setNewGroupName('');
      setNewGroupDescription('');
      setShowAddGroup(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create group');
    }
  }

  async function handleCreateSubgroup() {
    if (!newGroupName.trim() || !selectedParentGroup) {
      toast.error('Please enter a name');
      return;
    }
    try {
      await axios.post(API_URL + '/api/groups', {
        name: newGroupName,
        description: newGroupDescription,
        parent_id: selectedParentGroup.id
      }, { headers: { Authorization: 'Bearer ' + token } });
      toast.success('Subgroup created');
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedParentGroup(null);
      setShowAddSubgroup(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create subgroup');
    }
  }

  async function handleUpdateGroup() {
    if (!selectedGroup || !newGroupName.trim()) return;
    try {
      await axios.put(API_URL + '/api/groups/' + selectedGroup.id, {
        name: newGroupName,
        description: newGroupDescription
      }, { headers: { Authorization: 'Bearer ' + token } });
      toast.success('Group updated');
      setSelectedGroup(null);
      setNewGroupName('');
      setNewGroupDescription('');
      setShowEditGroup(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update group');
    }
  }

  async function handleDeleteGroup(groupId) {
    if (!window.confirm('Delete this group and all subgroups?')) return;
    try {
      await axios.delete(API_URL + '/api/groups/' + groupId, { headers: { Authorization: 'Bearer ' + token } });
      toast.success('Group deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete group');
    }
  }

  async function handleAssignCampers() {
    if (!selectedGroup) return;
    try {
      await axios.put(API_URL + '/api/groups/' + selectedGroup.id + '/campers', {
        camper_ids: selectedCamperIds
      }, { headers: { Authorization: 'Bearer ' + token } });
      toast.success('Campers assigned');
      setShowAssignCampers(false);
      setSelectedGroup(null);
      setSelectedCamperIds([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to assign campers');
    }
  }

  function openAssignDialog(group) {
    setSelectedGroup(group);
    setSelectedCamperIds(group.camper_ids || []);
    setShowAssignCampers(true);
  }

  function openEditDialog(group) {
    setSelectedGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setShowEditGroup(true);
  }

  function openSubgroupDialog(parentGroup) {
    setSelectedParentGroup(parentGroup);
    setNewGroupName('');
    setNewGroupDescription('');
    setShowAddSubgroup(true);
  }

  function exportGroupList(group) {
    const groupCampers = campers.filter(function(c) { return (group.camper_ids || []).includes(c.id); });
    const csvContent = [
      ['First Name', 'Last Name', 'Grade', 'Yeshiva', 'Parent Phone', 'Parent Email'].join(','),
      ...groupCampers.map(function(c) {
        return [c.first_name, c.last_name, c.grade || '', c.yeshiva || '', c.father_cell || c.mother_cell || '', c.parent_email || ''].map(function(val) { return '"' + val + '"'; }).join(',');
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = group.name.replace(/\s+/g, '_') + '_campers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Group list exported');
  }

  const parentGroups = groups.filter(function(g) { return !g.parent_id; });
  
  function getSubgroups(parentId) {
    return groups.filter(function(g) { return g.parent_id === parentId; });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#2D241E]">Groups</h1>
          <p className="text-muted-foreground mt-1">Organize campers into hierarchical groups</p>
        </div>
        <Button onClick={function() { setShowAddGroup(true); }} className="btn-camp-primary" data-testid="add-group-btn">
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      <Card className="card-camp">
        <CardHeader>
          <CardTitle className="font-heading text-xl flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#E85D04]" />
            All Groups
          </CardTitle>
          <CardDescription>
            Create parent groups (Transportation, Shiurim) and subgroups (Bus 1, Bus 2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parentGroups.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No groups created yet</p>
              <Button onClick={function() { setShowAddGroup(true); }} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create your first group
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {parentGroups.map(function(group) {
                const subgroups = getSubgroups(group.id);
                const isExpanded = expandedGroups[group.id];
                return (
                  <GroupRow
                    key={group.id}
                    group={group}
                    subgroups={subgroups}
                    campers={campers}
                    expanded={isExpanded}
                    onToggle={function() { setExpandedGroups(function(prev) { return { ...prev, [group.id]: !prev[group.id] }; }); }}
                    onEdit={function() { openEditDialog(group); }}
                    onDelete={function() { handleDeleteGroup(group.id); }}
                    onAssign={function() { openAssignDialog(group); }}
                    onExport={function() { exportGroupList(group); }}
                    onAddSubgroup={function() { openSubgroupDialog(group); }}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Create Group</DialogTitle>
            <DialogDescription>Create a parent group like Transportation, Shiurim, Activities</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name *</Label>
              <Input value={newGroupName} onChange={function(e) { setNewGroupName(e.target.value); }} placeholder="e.g., Transportation, Shiurim" data-testid="group-name-input" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newGroupDescription} onChange={function(e) { setNewGroupDescription(e.target.value); }} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={function() { setShowAddGroup(false); }}>Cancel</Button>
            <Button onClick={handleCreateGroup} className="btn-camp-primary">Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSubgroup} onOpenChange={setShowAddSubgroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Create Subgroup</DialogTitle>
            <DialogDescription>Create a subgroup under {selectedParentGroup ? selectedParentGroup.name : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Parent Group</p>
              <p className="font-medium">{selectedParentGroup ? selectedParentGroup.name : ''}</p>
            </div>
            <div>
              <Label>Subgroup Name *</Label>
              <Input value={newGroupName} onChange={function(e) { setNewGroupName(e.target.value); }} placeholder="e.g., Bus 1, Shiur Aleph" data-testid="subgroup-name-input" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newGroupDescription} onChange={function(e) { setNewGroupDescription(e.target.value); }} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={function() { setShowAddSubgroup(false); }}>Cancel</Button>
            <Button onClick={handleCreateSubgroup} className="btn-camp-primary">Create Subgroup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditGroup} onOpenChange={setShowEditGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name *</Label>
              <Input value={newGroupName} onChange={function(e) { setNewGroupName(e.target.value); }} placeholder="Group name" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newGroupDescription} onChange={function(e) { setNewGroupDescription(e.target.value); }} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={function() { setShowEditGroup(false); }}>Cancel</Button>
            <Button onClick={handleUpdateGroup} className="btn-camp-primary">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignCampers} onOpenChange={setShowAssignCampers}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Assign Campers</DialogTitle>
            <DialogDescription>Select campers to assign to {selectedGroup ? selectedGroup.name : ''}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {campers.map(function(camper) {
                var isSelected = selectedCamperIds.includes(camper.id);
                return (
                  <div
                    key={camper.id}
                    className={'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ' + (isSelected ? 'bg-[#E85D04]/10 border border-[#E85D04]' : 'bg-gray-50 hover:bg-gray-100 border border-transparent')}
                    onClick={function() {
                      if (isSelected) {
                        setSelectedCamperIds(selectedCamperIds.filter(function(id) { return id !== camper.id; }));
                      } else {
                        setSelectedCamperIds([...selectedCamperIds, camper.id]);
                      }
                    }}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <div className="flex-1">
                      <p className="font-medium">{camper.first_name} {camper.last_name}</p>
                      <p className="text-sm text-muted-foreground">{camper.grade} - {camper.yeshiva || 'No yeshiva'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">{selectedCamperIds.length} camper(s) selected</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={function() { setShowAssignCampers(false); }}>Cancel</Button>
              <Button onClick={handleAssignCampers} className="btn-camp-primary">Save Assignments</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
