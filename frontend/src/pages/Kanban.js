import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
  User, Phone, Mail, MessageSquare, GripVertical, MoveRight, Calendar,
  DollarSign, GraduationCap, Building2, AlertCircle, Send, Edit
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
  'Applied': 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
  'Accepted': 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20',
  'Check/Unknown': 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20',
  'Invoice Sent': 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
  'Payment Plan - Request': 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20',
  'Payment Plan Running': 'bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20',
  'Sending Check': 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20',
  'Partial Paid': 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20',
  'Partial Paid & Committed': 'bg-lime-500/10 border-lime-500/30 hover:bg-lime-500/20',
  'Paid in Full': 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20',
};

const HEADER_COLORS = {
  'Applied': 'bg-blue-500',
  'Accepted': 'bg-green-500',
  'Check/Unknown': 'bg-yellow-500',
  'Invoice Sent': 'bg-purple-500',
  'Payment Plan - Request': 'bg-orange-500',
  'Payment Plan Running': 'bg-teal-500',
  'Sending Check': 'bg-indigo-500',
  'Partial Paid': 'bg-amber-500',
  'Partial Paid & Committed': 'bg-lime-500',
  'Paid in Full': 'bg-emerald-500',
};

// Status triggers that require email confirmation
const EMAIL_TRIGGERS = {
  'Accepted': { template: 'status_accepted', label: 'Acceptance Email' },
  'Invoice Sent': { template: 'invoice_sent', label: 'Invoice Email' },
  'Paid in Full': { template: 'status_paid_in_full', label: 'Payment Confirmation' },
};

function CamperCard({ camper, onDragStart, onClick }) {
  // Calculate days until due or overdue
  const getDueDateInfo = () => {
    if (!camper.due_date) return null;
    const due = new Date(camper.due_date);
    const today = new Date();
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)} days overdue`, urgent: true };
    if (diff === 0) return { text: 'Due today', urgent: true };
    if (diff <= 7) return { text: `Due in ${diff} days`, urgent: true };
    return { text: camper.due_date, urgent: false };
  };

  const dueDateInfo = getDueDateInfo();

  return (
    <div
      className="bg-white rounded-xl border-2 border-gray-100 p-4 cursor-pointer hover:shadow-lg hover:border-[#E85D04]/30 transition-all duration-200 group"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      data-testid={'kanban-card-' + camper.id}
    >
      {/* Header with Photo and Name */}
      <div className="flex gap-3 mb-3">
        <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab mt-1 flex-shrink-0" />
        
        {/* Photo - Bigger */}
        <div className="flex-shrink-0">
          {camper.photo_url ? (
            <img 
              src={camper.photo_url} 
              alt={camper.first_name}
              className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E85D04]/20 to-[#E85D04]/10 flex items-center justify-center border-2 border-[#E85D04]/20">
              <User className="w-7 h-7 text-[#E85D04]" />
            </div>
          )}
        </div>

        {/* Name & Basic Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[#2D241E] text-base hover:text-[#E85D04] transition-colors">
            {camper.first_name} {camper.last_name}
          </h4>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {camper.grade && (
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {camper.grade}
              </span>
            )}
            {camper.yeshiva && (
              <span className="flex items-center gap-1 truncate">
                <Building2 className="w-3 h-3" />
                {camper.yeshiva}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Due Date - Prominent */}
      {dueDateInfo && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 ${
          dueDateInfo.urgent ? 'bg-red-50 text-red-700' : 'bg-[#E85D04]/10 text-[#E85D04]'
        }`}>
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">{dueDateInfo.text}</span>
          {dueDateInfo.urgent && <AlertCircle className="w-4 h-4 ml-auto" />}
        </div>
      )}

      {/* Parent Info */}
      {camper.parent_name && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-sm font-medium text-[#2D241E] mb-2">
            {camper.parent_name}
          </p>
          
          {/* Contact Details */}
          <div className="space-y-1 mb-3">
            {camper.parent_phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Phone className="w-3 h-3" />
                {camper.parent_phone}
              </p>
            )}
            {camper.parent_email && (
              <p className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{camper.parent_email}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Balance Info (if available) */}
      {camper.balance !== undefined && camper.balance > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Outstanding:</span>
          <span className="text-sm font-bold text-[#E76F51]">
            ${camper.balance.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ status, campers, isDragOver, onDragOver, onDragLeave, onDrop, onCamperDragStart, onCamperClick }) {
  const baseClass = "min-w-[320px] max-w-[320px] rounded-xl p-4 transition-all duration-200";
  const dragClass = isDragOver ? " ring-2 ring-[#E85D04] ring-offset-2 scale-[1.02]" : "";
  const colorClass = STATUS_COLORS[status] || "bg-gray-100";
  const headerDotClass = HEADER_COLORS[status] || "bg-gray-500";
  
  return (
    <div
      className={`${baseClass} ${colorClass} ${dragClass}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-testid={'kanban-column-' + status.toLowerCase().replace(/[^a-z]/g, '-')}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${headerDotClass}`} />
          <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-[#2D241E]">
            {status}
          </h3>
        </div>
        <Badge variant="secondary" className="font-bold text-sm">
          {campers ? campers.length : 0}
        </Badge>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {(!campers || campers.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-gray-200 rounded-lg">
            <MoveRight className="w-6 h-6 mx-auto mb-2 opacity-40" />
            Drop campers here
          </div>
        ) : (
          campers.map((camper) => (
            <CamperCard 
              key={camper.id} 
              camper={camper} 
              onDragStart={(e) => onCamperDragStart(e, camper)}
              onClick={() => onCamperClick(camper)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Kanban() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState({});
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedCamper, setDraggedCamper] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  
  // Email confirmation dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  const [emailContent, setEmailContent] = useState({ subject: '', body: '' });
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    fetchBoard();
  }, [token]);

  const fetchBoard = async () => {
    try {
      const response = await axios.get(API_URL + '/api/kanban', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setBoard(response.data.board);
      setStatuses(response.data.statuses);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch kanban board');
      setLoading(false);
    }
  };

  const handleDragStart = (camper, fromStatus) => {
    setDraggedCamper({ camper, fromStatus });
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e, toStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    
    if (!draggedCamper || draggedCamper.fromStatus === toStatus) {
      setDraggedCamper(null);
      return;
    }

    const { camper, fromStatus } = draggedCamper;
    
    // Check if this status change triggers an email
    if (EMAIL_TRIGGERS[toStatus]) {
      setPendingMove({ camper, fromStatus, toStatus });
      setLoadingEmail(true);
      
      // Fetch email template preview from the new endpoint
      try {
        const response = await axios.get(
          `${API_URL}/api/campers/${camper.id}/email-preview?new_status=${encodeURIComponent(toStatus)}`,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        if (response.data.has_template) {
          setEmailContent({
            subject: response.data.subject,
            body: response.data.body,
            recipient: response.data.recipient_email,
            templateName: response.data.template_name,
            templateType: response.data.template_type
          });
        } else {
          // No template configured - show message
          setEmailContent({
            subject: '',
            body: '',
            noTemplate: true,
            message: `No email template configured for "${toStatus}" status. You can create one in Settings > Templates.`
          });
        }
      } catch (error) {
        setEmailContent({
          subject: '',
          body: '',
          noTemplate: true,
          message: 'Could not load email template. You can configure templates in Settings.'
        });
      }
      
      setLoadingEmail(false);
      setShowEmailDialog(true);
      setDraggedCamper(null);
      return;
    }
    
    // No email trigger - proceed directly
    await executeMove(camper, fromStatus, toStatus, false);
    setDraggedCamper(null);
  };

  const executeMove = async (camper, fromStatus, toStatus, skipEmail = false) => {
    // Optimistic update
    const newBoard = { ...board };
    Object.keys(newBoard).forEach(key => {
      newBoard[key] = [...(newBoard[key] || [])];
    });
    
    newBoard[fromStatus] = newBoard[fromStatus].filter(c => c.id !== camper.id);
    if (!newBoard[toStatus]) newBoard[toStatus] = [];
    newBoard[toStatus].push({ ...camper, status: toStatus });
    
    setBoard(newBoard);

    try {
      await axios.put(
        `${API_URL}/api/campers/${camper.id}/status?status=${encodeURIComponent(toStatus)}&skip_email=${skipEmail}`,
        {},
        { headers: { Authorization: 'Bearer ' + token }}
      );
      toast.success(`${camper.first_name} moved to ${toStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
      fetchBoard();
    }
  };

  const confirmEmailAndMove = async () => {
    if (!pendingMove) return;
    
    const { camper, fromStatus, toStatus } = pendingMove;
    
    // Execute the move (email will be sent by backend using template)
    await executeMove(camper, fromStatus, toStatus, false);
    
    if (!emailContent.noTemplate) {
      toast.success(`Email queued for ${emailContent.recipient || 'parent'}`);
    }
    
    // Reset state
    setShowEmailDialog(false);
    setPendingMove(null);
    setEmailContent({ subject: '', body: '' });
  };

  const skipEmailAndMove = async () => {
    if (!pendingMove) return;
    
    const { camper, fromStatus, toStatus } = pendingMove;
    await executeMove(camper, fromStatus, toStatus, true);
    
    setShowEmailDialog(false);
    setPendingMove(null);
    setEmailContent({ subject: '', body: '' });
  };

  const handleCamperClick = (camper) => {
    navigate(`/campers/${camper.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="kanban-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
          Enrollment Pipeline
        </h1>
        <p className="text-muted-foreground mt-1">
          Drag and drop campers between stages • Click any card to view details
        </p>
      </div>

      {/* Legend */}
      <Card className="card-camp mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Status Flow:</span>
            {statuses.slice(0, 5).map((status, i) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${HEADER_COLORS[status] || 'bg-gray-500'}`} />
                <span className="text-sm">{status}</span>
                {i < 4 && <MoveRight className="w-4 h-4 text-gray-300" />}
              </div>
            ))}
            <span className="text-sm text-muted-foreground">→ ...</span>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4 min-w-max pb-4">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              campers={board[status] || []}
              isDragOver={dragOverStatus === status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
              onCamperDragStart={(e, camper) => handleDragStart(camper, status)}
              onCamperClick={handleCamperClick}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Email Confirmation Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl flex items-center gap-2">
              <Send className="w-6 h-6 text-[#E85D04]" />
              Confirm Email Before Sending
            </DialogTitle>
            <DialogDescription>
              Moving {pendingMove?.camper?.first_name} to "{pendingMove?.toStatus}" will send this email to the parent.
              You can edit the content below before sending.
            </DialogDescription>
          </DialogHeader>
          
          {loadingEmail ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E85D04]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recipient Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E85D04]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#E85D04]" />
                  </div>
                  <div>
                    <p className="font-medium">{pendingMove?.camper?.parent_name || 'Parent'}</p>
                    <p className="text-sm text-muted-foreground">{pendingMove?.camper?.parent_email || 'No email'}</p>
                  </div>
                </div>
              </div>
              
              {emailContent.noTemplate ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">{emailContent.message}</p>
                </div>
              ) : (
                <>
                  {/* Template Name */}
                  {emailContent.templateName && (
                    <div className="text-sm text-muted-foreground">
                      Using template: <span className="font-medium">{emailContent.templateName}</span>
                    </div>
                  )}
                  
                  {/* Subject */}
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <input
                      type="text"
                      value={emailContent.subject}
                      onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E85D04] focus:border-transparent"
                    />
                  </div>
                  
                  {/* Body */}
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={emailContent.body}
                      onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                      rows={10}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailDialog(false);
                setPendingMove(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={skipEmailAndMove}
            >
              {emailContent.noTemplate ? 'Move Anyway' : 'Move Without Email'}
            </Button>
            {!emailContent.noTemplate && (
              <Button
                className="btn-camp-primary"
                onClick={confirmEmailAndMove}
                disabled={!pendingMove?.camper?.parent_email}
              >
                <Send className="w-4 h-4 mr-2" />
                Send & Move
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Kanban;
