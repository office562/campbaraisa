import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { User, Phone, Mail, MessageSquare, GripVertical, MoveRight, Calendar, ExternalLink } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const statusColors = {
  'Applied': 'bg-blue-500/10 border-blue-500/30',
  'Accepted': 'bg-green-500/10 border-green-500/30',
  'Check/Unknown': 'bg-yellow-500/10 border-yellow-500/30',
  'Invoice Sent': 'bg-purple-500/10 border-purple-500/30',
  'Payment Plan - Request': 'bg-orange-500/10 border-orange-500/30',
  'Payment Plan Running': 'bg-teal-500/10 border-teal-500/30',
  'Sending Check': 'bg-indigo-500/10 border-indigo-500/30',
  'Partial Paid': 'bg-amber-500/10 border-amber-500/30',
  'Partial Paid & Committed': 'bg-lime-500/10 border-lime-500/30',
  'Paid in Full': 'bg-emerald-500/10 border-emerald-500/30',
};

const headerColors = {
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

function Kanban() {
  const { token } = useAuth();
  const [board, setBoard] = useState({});
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedCamper, setDraggedCamper] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  async function fetchBoard() {
    try {
      const response = await axios.get(API_URL + '/api/kanban', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setBoard(response.data.board);
      setStatuses(response.data.statuses);
    } catch (error) {
      toast.error('Failed to fetch kanban board');
    } finally {
      setLoading(false);
    }
  }

  useEffect(function() {
    fetchBoard();
  }, [token]);

  function handleDragStart(e, camper, fromStatus) {
    setDraggedCamper({ camper: camper, fromStatus: fromStatus });
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, status) {
    e.preventDefault();
    setDragOverStatus(status);
  }

  function handleDragLeave() {
    setDragOverStatus(null);
  }

  async function handleDrop(e, toStatus) {
    e.preventDefault();
    setDragOverStatus(null);
    
    if (!draggedCamper || draggedCamper.fromStatus === toStatus) {
      setDraggedCamper(null);
      return;
    }

    const camper = draggedCamper.camper;
    const fromStatus = draggedCamper.fromStatus;
    
    // Optimistic update
    const newBoard = { ...board };
    newBoard[fromStatus] = newBoard[fromStatus].filter(function(c) { return c.id !== camper.id; });
    newBoard[toStatus] = [...(newBoard[toStatus] || []), { ...camper, status: toStatus }];
    setBoard(newBoard);
    setDraggedCamper(null);

    try {
      await axios.put(
        API_URL + '/api/campers/' + camper.id + '/status?status=' + encodeURIComponent(toStatus),
        {},
        { headers: { Authorization: 'Bearer ' + token }}
      );
      toast.success(camper.first_name + ' moved to ' + toStatus);
      
      if (toStatus === 'Accepted' || toStatus === 'Paid in Full') {
        toast.info('Automated email has been queued');
      }
    } catch (error) {
      toast.error('Failed to update status');
      fetchBoard(); // Revert on error
    }
  }

  function handleCall(phone) {
    window.location.href = 'tel:' + phone;
  }

  function handleEmail(email) {
    window.location.href = 'mailto:' + email;
  }

  function handleSMS(phone) {
    window.location.href = 'sms:' + phone;
  }

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
          Drag and drop campers between stages to update their status
        </p>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4 min-w-max">
          {statuses.map(function(status) {
            const columnClass = 'kanban-column ' + (dragOverStatus === status ? 'ring-2 ring-[#E85D04] ring-offset-2' : '') + ' ' + (statusColors[status] || '');
            
            return (
              <div
                key={status}
                className={columnClass}
                onDragOver={function(e) { handleDragOver(e, status); }}
                onDragLeave={handleDragLeave}
                onDrop={function(e) { handleDrop(e, status); }}
                data-testid={'kanban-column-' + status.toLowerCase().replace(/[^a-z]/g, '-')}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={'w-3 h-3 rounded-full ' + (headerColors[status] || 'bg-gray-500')} />
                    <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-[#2D241E]">
                      {status}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {board[status] ? board[status].length : 0}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {board[status] && board[status].map(function(camper) {
                    return (
                      <div
                        key={camper.id}
                        className="kanban-card group"
                        draggable
                        onDragStart={function(e) { handleDragStart(e, camper, status); }}
                        data-testid={'kanban-card-' + camper.id}
                      >
                        <div className="flex gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab mt-1 flex-shrink-0" />
                          
                          {/* Photo */}
                          <div className="flex-shrink-0">
                            {camper.photo_url ? (
                              <img 
                                src={camper.photo_url} 
                                alt={camper.first_name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[#E85D04]/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-[#E85D04]" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#2D241E]">
                              {camper.first_name} {camper.last_name}
                            </p>
                            
                            {/* Grade & Yeshiva */}
                            <div className="text-xs text-muted-foreground mt-1">
                              {camper.grade && <span>{camper.grade}</span>}
                              {camper.grade && camper.yeshiva && <span> • </span>}
                              {camper.yeshiva && <span className="truncate">{camper.yeshiva}</span>}
                            </div>

                            {/* Due Date */}
                            {camper.due_date && (
                              <div className="flex items-center gap-1 text-xs mt-1">
                                <Calendar className="w-3 h-3 text-[#E85D04]" />
                                <span className="text-[#E85D04] font-medium">Due: {camper.due_date}</span>
                              </div>
                            )}

                            {/* Parent Info */}
                            {camper.parent_name && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  {camper.parent_name}
                                </p>
                                
                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-1">
                                  {camper.parent_phone && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-700"
                                        onClick={function(e) { e.stopPropagation(); handleCall(camper.parent_phone); }}
                                        title={'Call ' + camper.parent_phone}
                                      >
                                        <Phone className="w-3 h-3 mr-1" />
                                        Call
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-700"
                                        onClick={function(e) { e.stopPropagation(); handleSMS(camper.parent_phone); }}
                                        title={'SMS ' + camper.parent_phone}
                                      >
                                        <MessageSquare className="w-3 h-3 mr-1" />
                                        SMS
                                      </Button>
                                    </>
                                  )}
                                  {camper.parent_email && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs hover:bg-purple-50 hover:text-purple-700"
                                      onClick={function(e) { e.stopPropagation(); handleEmail(camper.parent_email); }}
                                      title={'Email ' + camper.parent_email}
                                    >
                                      <Mail className="w-3 h-3 mr-1" />
                                      Email
                                    </Button>
                                  )}
                                </div>

                                {/* Contact Details */}
                                <div className="mt-2 space-y-1">
                                  {camper.parent_phone && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {camper.parent_phone}
                                    </p>
                                  )}
                                  {camper.parent_email && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                      <Mail className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{camper.parent_email}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!board[status] || board[status].length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <MoveRight className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      Drop campers here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <Card className="card-camp mt-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Status Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {statuses.map(function(status, idx) {
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className={'w-3 h-3 rounded-full ' + (headerColors[status] || 'bg-gray-500')} />
                  <span className="text-sm">{status}</span>
                  {idx < statuses.length - 1 && (
                    <MoveRight className="w-4 h-4 text-gray-300 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Note:</strong> Moving to "Accepted" or "Paid in Full" will automatically trigger an email to the parent.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Kanban;
