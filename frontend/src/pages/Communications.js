import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Search, 
  Mail,
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Communications = () => {
  const { token } = useAuth();
  const [communications, setCommunications] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    parent_id: '', type: 'email', subject: '', message: ''
  });

  const fetchData = async () => {
    try {
      const [commsRes, parentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/communications`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/parents`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setCommunications(commsRes.data);
      setParents(parentsRes.data);
    } catch (error) {
      toast.error('Failed to fetch communications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/communications`, {
        ...newMessage,
        direction: 'outbound'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message queued successfully');
      setShowCompose(false);
      setNewMessage({ parent_id: '', type: 'email', subject: '', message: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getParentName = (parentId) => {
    const parent = parents.find(p => p.id === parentId);
    return parent ? `${parent.first_name} ${parent.last_name}` : 'Unknown';
  };

  const getParentEmail = (parentId) => {
    const parent = parents.find(p => p.id === parentId);
    return parent?.email || '';
  };

  const filteredComms = communications.filter(comm => {
    const parentName = getParentName(comm.parent_id).toLowerCase();
    const matchesSearch = parentName.includes(searchTerm.toLowerCase()) ||
      comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const pendingCount = communications.filter(c => c.status === 'pending').length;
  const sentCount = communications.filter(c => c.status === 'sent').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="communications-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Communications
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all parent communications
          </p>
        </div>
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogTrigger asChild>
            <Button className="btn-camp-primary" data-testid="compose-btn">
              <Plus className="w-4 h-4 mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Compose Message</DialogTitle>
              <DialogDescription>Send an email or SMS to a parent</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <Label>Recipient</Label>
                <Select
                  value={newMessage.parent_id}
                  onValueChange={(value) => setNewMessage({...newMessage, parent_id: value})}
                >
                  <SelectTrigger data-testid="recipient-select">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map(parent => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.first_name} {parent.last_name} ({parent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newMessage.type}
                  onValueChange={(value) => setNewMessage({...newMessage, type: value})}
                >
                  <SelectTrigger data-testid="message-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newMessage.type === 'email' && (
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                    placeholder="Email subject"
                    data-testid="message-subject"
                  />
                </div>
              )}
              <div>
                <Label>Message</Label>
                <Textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  placeholder="Type your message..."
                  rows={5}
                  required
                  data-testid="message-body"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="btn-camp-primary" disabled={!newMessage.parent_id} data-testid="send-message-btn">
                  <Send className="w-4 h-4 mr-2" />
                  Queue Message
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">Total Messages</p>
                <p className="text-3xl font-bold text-[#2D241E] mt-1">{communications.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-[#E85D04]/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">Pending</p>
                <p className="text-3xl font-bold text-[#E9C46A] mt-1">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-[#E9C46A]/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">Sent</p>
                <p className="text-3xl font-bold text-[#2A9D8F] mt-1">{sentCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#2A9D8F]/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-camp mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="comm-search"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]" data-testid="type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card className="card-camp">
        <CardContent className="p-0">
          {filteredComms.length > 0 ? (
            <div className="divide-y">
              {filteredComms.map((comm) => (
                <div key={comm.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      comm.type === 'email' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {comm.type === 'email' ? (
                        <Mail className={`w-5 h-5 ${comm.type === 'email' ? 'text-blue-600' : 'text-green-600'}`} />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getParentName(comm.parent_id)}</span>
                        <Badge variant="outline" className={
                          comm.direction === 'outbound' ? 'border-[#E85D04] text-[#E85D04]' : 'border-blue-500 text-blue-500'
                        }>
                          {comm.direction}
                        </Badge>
                        <Badge className={
                          comm.status === 'sent' ? 'bg-emerald-100 text-emerald-800' :
                          comm.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {comm.status}
                        </Badge>
                      </div>
                      {comm.subject && (
                        <p className="font-medium text-sm mb-1">{comm.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">{comm.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(comm.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No communications found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-[#E85D04]/5 rounded-lg border border-[#E85D04]/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E85D04] mt-0.5" />
          <div>
            <p className="font-medium text-[#2D241E]">Email & SMS Integration</p>
            <p className="text-sm text-muted-foreground mt-1">
              Messages are currently queued. Configure Gmail API and Twilio in Settings to enable automatic sending.
              Automated emails are triggered when moving campers to "Accepted" or "Paid in Full" status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communications;
