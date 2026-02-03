import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Mail, MessageSquare, Send, Clock, CheckCircle, Eye, Calendar, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Communications() {
  const { token } = useAuth();
  const [communications, setCommunications] = useState([]);
  const [campers, setCampers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [newMessage, setNewMessage] = useState({ camper_id: '', type: 'email', subject: '', message: '' });

  useEffect(function() { fetchData(); }, [token]);

  function fetchData() {
    setLoading(true);
    Promise.all([
      axios.get(API_URL + '/api/communications', { headers: { Authorization: 'Bearer ' + token } }).catch(function() { return { data: [] }; }),
      axios.get(API_URL + '/api/campers', { headers: { Authorization: 'Bearer ' + token } })
    ]).then(function(res) {
      setCommunications(res[0].data || []);
      setCampers(res[1].data || []);
    }).catch(function() {
      toast.error('Failed to load data');
    }).finally(function() {
      setLoading(false);
    });
  }

  function handleSend(e) {
    e.preventDefault();
    var camper = campers.find(function(c) { return c.id === newMessage.camper_id; });
    if (!camper) { toast.error('Select a camper'); return; }
    
    axios.post(API_URL + '/api/communications', {
      camper_id: newMessage.camper_id,
      parent_id: newMessage.camper_id,
      type: newMessage.type,
      subject: newMessage.subject,
      message: newMessage.message,
      direction: 'outbound',
      recipient_email: camper.parent_email,
      recipient_phone: camper.father_cell || camper.mother_cell,
      recipient_name: (camper.father_first_name || '') + ' ' + (camper.father_last_name || camper.last_name)
    }, { headers: { Authorization: 'Bearer ' + token } }).then(function() {
      toast.success('Message queued');
      setShowCompose(false);
      setNewMessage({ camper_id: '', type: 'email', subject: '', message: '' });
      fetchData();
    }).catch(function() {
      toast.error('Failed to send');
    });
  }

  function getRecipientName(comm) {
    if (comm.recipient_name) return comm.recipient_name;
    var camper = campers.find(function(c) { return c.id === comm.camper_id || c.id === comm.parent_id; });
    if (camper) return (camper.father_first_name || '') + ' ' + (camper.father_last_name || camper.last_name);
    return 'Unknown';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return dateStr; }
  }

  var emailComms = communications.filter(function(c) { return c.type === 'email'; });
  var smsComms = communications.filter(function(c) { return c.type === 'sms'; });

  var filtered = communications.filter(function(c) {
    var name = getRecipientName(c).toLowerCase();
    var matchSearch = name.indexOf(searchTerm.toLowerCase()) >= 0 || (c.subject || '').toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0 || (c.message || '').toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0;
    var matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  var pendingCount = communications.filter(function(c) { return c.status === 'pending'; }).length;
  var sentCount = communications.filter(function(c) { return c.status === 'sent'; }).length;

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E85D04]"></div></div>;

  return (
    <div data-testid="communications-page" className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#2D241E]">Communications</h1>
          <p className="text-muted-foreground">View and manage all parent communications</p>
        </div>
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogTrigger asChild>
            <Button className="btn-camp-primary" data-testid="compose-btn"><Plus className="w-4 h-4 mr-2" />Compose</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>Send email or SMS to a parent</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <Label>Recipient (Camper Family)</Label>
                <Select value={newMessage.camper_id} onValueChange={function(v) { setNewMessage(Object.assign({}, newMessage, { camper_id: v })); }}>
                  <SelectTrigger><SelectValue placeholder="Select camper family" /></SelectTrigger>
                  <SelectContent>
                    {campers.map(function(c) {
                      return <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.parent_email || 'No email'})</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newMessage.type} onValueChange={function(v) { setNewMessage(Object.assign({}, newMessage, { type: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newMessage.type === 'email' && (
                <div>
                  <Label>Subject</Label>
                  <Input value={newMessage.subject} onChange={function(e) { setNewMessage(Object.assign({}, newMessage, { subject: e.target.value })); }} placeholder="Email subject" />
                </div>
              )}
              <div>
                <Label>Message</Label>
                <Textarea value={newMessage.message} onChange={function(e) { setNewMessage(Object.assign({}, newMessage, { message: e.target.value })); }} placeholder="Type your message..." rows={5} required />
              </div>
              <DialogFooter>
                <Button type="submit" className="btn-camp-primary" disabled={!newMessage.camper_id}><Send className="w-4 h-4 mr-2" />Send</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{communications.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Emails</p><p className="text-2xl font-bold text-blue-600">{emailComms.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">SMS</p><p className="text-2xl font-bold text-green-600">{smsComms.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search messages..." value={searchTerm} onChange={function(e) { setSearchTerm(e.target.value); }} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({communications.length})</TabsTrigger>
              <TabsTrigger value="email">Email ({emailComms.length})</TabsTrigger>
              <TabsTrigger value="sms">SMS ({smsComms.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <MessageList messages={filtered} getRecipientName={getRecipientName} formatDate={formatDate} onView={setShowDetail} />
            </TabsContent>
            <TabsContent value="email">
              <MessageList messages={filtered.filter(function(c) { return c.type === 'email'; })} getRecipientName={getRecipientName} formatDate={formatDate} onView={setShowDetail} />
            </TabsContent>
            <TabsContent value="sms">
              <MessageList messages={filtered.filter(function(c) { return c.type === 'sms'; })} getRecipientName={getRecipientName} formatDate={formatDate} onView={setShowDetail} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!showDetail} onOpenChange={function() { setShowDetail(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showDetail && showDetail.type === 'email' ? <Mail className="w-5 h-5 text-blue-600" /> : <MessageSquare className="w-5 h-5 text-green-600" />}
              Message Details
            </DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Type</Label><p className="font-medium capitalize">{showDetail.type}</p></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label><Badge className={showDetail.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>{showDetail.status || 'pending'}</Badge></div>
                <div><Label className="text-xs text-muted-foreground">Recipient</Label><p className="font-medium">{getRecipientName(showDetail)}</p></div>
                <div><Label className="text-xs text-muted-foreground">Date</Label><p className="font-medium">{formatDate(showDetail.created_at || showDetail.sent_at)}</p></div>
              </div>
              {showDetail.recipient_email && <div><Label className="text-xs text-muted-foreground">Email</Label><p>{showDetail.recipient_email}</p></div>}
              {showDetail.recipient_phone && <div><Label className="text-xs text-muted-foreground">Phone</Label><p>{showDetail.recipient_phone}</p></div>}
              {showDetail.subject && <div><Label className="text-xs text-muted-foreground">Subject</Label><p className="font-medium">{showDetail.subject}</p></div>}
              <div><Label className="text-xs text-muted-foreground">Message</Label><div className="p-3 bg-gray-50 rounded-lg mt-1 whitespace-pre-wrap">{showDetail.message}</div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageList({ messages, getRecipientName, formatDate, onView }) {
  if (messages.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No messages found</div>;
  }
  return (
    <div className="space-y-2">
      {messages.map(function(msg) {
        return (
          <div key={msg.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={function() { onView(msg); }}>
            <div className="flex items-center gap-4">
              {msg.type === 'email' ? <Mail className="w-5 h-5 text-blue-600" /> : <MessageSquare className="w-5 h-5 text-green-600" />}
              <div>
                <p className="font-medium">{getRecipientName(msg)}</p>
                <p className="text-sm text-muted-foreground truncate max-w-md">{msg.subject || msg.message.substring(0, 50) + '...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={msg.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>{msg.status || 'pending'}</Badge>
              <span className="text-sm text-muted-foreground">{formatDate(msg.created_at)}</span>
              <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
