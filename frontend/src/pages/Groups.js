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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Folder, FolderOpen, ChevronDown, ChevronRight, Edit, Trash2, UserPlus, Download } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Groups() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [campers, setCampers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [dialog, setDialog] = useState({ type: null, data: null });
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedCampers, setSelectedCampers] = useState([]);

  useEffect(function() { fetchData(); }, [token]);

  function fetchData() {
    setLoading(true);
    Promise.all([
      axios.get(API_URL + '/api/groups', { headers: { Authorization: 'Bearer ' + token } }),
      axios.get(API_URL + '/api/campers', { headers: { Authorization: 'Bearer ' + token } })
    ]).then(function(res) {
      setGroups(res[0].data || []);
      setCampers(res[1].data || []);
    }).catch(function() {
      toast.error('Failed to load data');
    }).finally(function() {
      setLoading(false);
    });
  }

  function openDialog(type, data) {
    setDialog({ type: type, data: data });
    if (type === 'edit') {
      setForm({ name: data.name, description: data.description || '' });
    } else if (type === 'assign') {
      setSelectedCampers(data.camper_ids || []);
    } else {
      setForm({ name: '', description: '' });
    }
  }

  function closeDialog() {
    setDialog({ type: null, data: null });
    setForm({ name: '', description: '' });
    setSelectedCampers([]);
  }

  function handleCreate() {
    if (!form.name.trim()) { toast.error('Enter a name'); return; }
    var parentId = dialog.type === 'subgroup' ? dialog.data.id : null;
    axios.post(API_URL + '/api/groups', { name: form.name, description: form.description, parent_id: parentId }, { headers: { Authorization: 'Bearer ' + token } })
      .then(function() { toast.success('Group created'); closeDialog(); fetchData(); })
      .catch(function() { toast.error('Failed to create'); });
  }

  function handleUpdate() {
    if (!form.name.trim()) { toast.error('Enter a name'); return; }
    axios.put(API_URL + '/api/groups/' + dialog.data.id, { name: form.name, description: form.description }, { headers: { Authorization: 'Bearer ' + token } })
      .then(function() { toast.success('Updated'); closeDialog(); fetchData(); })
      .catch(function() { toast.error('Failed to update'); });
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this group?')) return;
    axios.delete(API_URL + '/api/groups/' + id, { headers: { Authorization: 'Bearer ' + token } })
      .then(function() { toast.success('Deleted'); fetchData(); })
      .catch(function() { toast.error('Failed to delete'); });
  }

  function handleAssign() {
    axios.put(API_URL + '/api/groups/' + dialog.data.id + '/campers', { camper_ids: selectedCampers }, { headers: { Authorization: 'Bearer ' + token } })
      .then(function() { toast.success('Campers assigned'); closeDialog(); fetchData(); })
      .catch(function() { toast.error('Failed to assign'); });
  }

  function exportList(group) {
    var list = campers.filter(function(c) { return (group.camper_ids || []).indexOf(c.id) >= 0; });
    var csv = 'First Name,Last Name,Grade,Yeshiva,Phone,Email\n' + list.map(function(c) {
      return [c.first_name, c.last_name, c.grade || '', c.yeshiva || '', c.father_cell || c.mother_cell || '', c.parent_email || ''].join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = group.name + '.csv'; a.click();
    toast.success('Exported');
  }

  var parents = groups.filter(function(g) { return !g.parent_id; });

  function getSubs(pid) { return groups.filter(function(g) { return g.parent_id === pid; }); }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E85D04]"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#2D241E]">Groups</h1>
          <p className="text-muted-foreground">Organize campers into hierarchical groups</p>
        </div>
        <Button onClick={function() { openDialog('create', null); }} className="btn-camp-primary" data-testid="add-group-btn">
          <Plus className="w-4 h-4 mr-2" />Create Group
        </Button>
      </div>

      <Card className="card-camp">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Folder className="w-5 h-5 text-[#E85D04]" />All Groups</CardTitle>
          <CardDescription>Create parent groups (Transportation, Shiurim) then add subgroups (Bus 1, Bus 2)</CardDescription>
        </CardHeader>
        <CardContent>
          {parents.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No groups yet</p>
              <Button variant="outline" onClick={function() { openDialog('create', null); }}><Plus className="w-4 h-4 mr-2" />Create first group</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {parents.map(function(g) {
                var subs = getSubs(g.id);
                var isOpen = expanded[g.id];
                return (
                  <div key={g.id} className="border rounded-lg">
                    <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={function() { setExpanded(function(p) { return Object.assign({}, p, { [g.id]: !p[g.id] }); }); }}>
                      <div className="flex items-center gap-3">
                        {subs.length > 0 ? (isOpen ? <ChevronDown className="w-5 h-5 text-[#E85D04]" /> : <ChevronRight className="w-5 h-5 text-[#E85D04]" />) : <div className="w-5" />}
                        {isOpen ? <FolderOpen className="w-5 h-5 text-[#E85D04]" /> : <Folder className="w-5 h-5 text-[#E85D04]" />}
                        <div><p className="font-medium">{g.name}</p>{g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}</div>
                      </div>
                      <div className="flex items-center gap-2" onClick={function(e) { e.stopPropagation(); }}>
                        <Badge className="bg-[#E85D04]/10 text-[#E85D04]">{(g.camper_ids || []).length} campers</Badge>
                        <Badge variant="outline">{subs.length} subgroups</Badge>
                        <Button variant="ghost" size="sm" onClick={function() { openDialog('subgroup', g); }}><Plus className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={function() { openDialog('assign', g); }}><UserPlus className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={function() { exportList(g); }}><Download className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={function() { openDialog('edit', g); }}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={function() { handleDelete(g.id); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {isOpen && subs.map(function(s) {
                      return (
                        <div key={s.id} className="flex items-center justify-between p-4 pl-12 border-t hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Folder className="w-4 h-4 text-[#F4A261]" />
                            <div><p className="font-medium">{s.name}</p>{s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-[#F4A261]/10 text-[#F4A261]">{(s.camper_ids || []).length} campers</Badge>
                            <Button variant="ghost" size="sm" onClick={function() { openDialog('assign', s); }}><UserPlus className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={function() { exportList(s); }}><Download className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-blue-600" onClick={function() { openDialog('edit', s); }}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={function() { handleDelete(s.id); }}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.type === 'create' || dialog.type === 'subgroup'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.type === 'subgroup' ? 'Create Subgroup' : 'Create Group'}</DialogTitle>
            <DialogDescription>{dialog.type === 'subgroup' ? 'Under ' + (dialog.data ? dialog.data.name : '') : 'Create a parent group'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); }} placeholder="e.g., Transportation" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { description: e.target.value }); }); }} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button className="btn-camp-primary" onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === 'edit'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); }} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { description: e.target.value }); }); }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button className="btn-camp-primary" onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === 'assign'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Campers</DialogTitle>
            <DialogDescription>Select campers for {dialog.data ? dialog.data.name : ''}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[350px]">
            <div className="space-y-2 pr-4">
              {campers.map(function(c) {
                var sel = selectedCampers.indexOf(c.id) >= 0;
                return (
                  <div key={c.id} className={'flex items-center gap-3 p-3 rounded-lg cursor-pointer ' + (sel ? 'bg-[#E85D04]/10 border border-[#E85D04]' : 'bg-gray-50 hover:bg-gray-100')} onClick={function() { setSelectedCampers(function(p) { return sel ? p.filter(function(x) { return x !== c.id; }) : p.concat([c.id]); }); }}>
                    <Checkbox checked={sel} className="pointer-events-none" />
                    <div><p className="font-medium">{c.first_name} {c.last_name}</p><p className="text-sm text-muted-foreground">{c.grade} - {c.yeshiva || 'N/A'}</p></div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">{selectedCampers.length} selected</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button className="btn-camp-primary" onClick={handleAssign}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
