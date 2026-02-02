import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { User, Phone, Mail, MessageSquare, GripVertical, MoveRight, Calendar } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
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

function CamperCard(props) {
  var camper = props.camper;
  var onDragStart = props.onDragStart;
  
  function handleCall() {
    if (camper.parent_phone) {
      window.location.href = 'tel:' + camper.parent_phone;
    }
  }
  
  function handleSMS() {
    if (camper.parent_phone) {
      window.location.href = 'sms:' + camper.parent_phone;
    }
  }
  
  function handleEmail() {
    if (camper.parent_email) {
      window.location.href = 'mailto:' + camper.parent_email;
    }
  }

  return (
    <div
      className="kanban-card group"
      draggable
      onDragStart={onDragStart}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-700"
                    onClick={handleCall}
                    title={'Call ' + camper.parent_phone}
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                )}
                {camper.parent_phone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-700"
                    onClick={handleSMS}
                    title={'SMS ' + camper.parent_phone}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    SMS
                  </Button>
                )}
                {camper.parent_email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs hover:bg-purple-50 hover:text-purple-700"
                    onClick={handleEmail}
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
}

function KanbanColumn(props) {
  var status = props.status;
  var campers = props.campers;
  var isDragOver = props.isDragOver;
  var onDragOver = props.onDragOver;
  var onDragLeave = props.onDragLeave;
  var onDrop = props.onDrop;
  var onCamperDragStart = props.onCamperDragStart;
  
  var baseClass = "kanban-column";
  var dragClass = isDragOver ? " ring-2 ring-[#E85D04] ring-offset-2" : "";
  var colorClass = STATUS_COLORS[status] ? " " + STATUS_COLORS[status] : "";
  var headerDotClass = HEADER_COLORS[status] || "bg-gray-500";
  
  function renderCampers() {
    if (!campers || campers.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <MoveRight className="w-6 h-6 mx-auto mb-2 opacity-40" />
          Drop campers here
        </div>
      );
    }
    
    var cards = [];
    for (var i = 0; i < campers.length; i++) {
      var camper = campers[i];
      cards.push(
        <CamperCard 
          key={camper.id} 
          camper={camper} 
          onDragStart={function(e) { onCamperDragStart(e, camper); }}
        />
      );
    }
    return cards;
  }
  
  return (
    <div
      className={baseClass + dragClass + colorClass}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-testid={'kanban-column-' + status.toLowerCase().replace(/[^a-z]/g, '-')}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={"w-3 h-3 rounded-full " + headerDotClass} />
          <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-[#2D241E]">
            {status}
          </h3>
        </div>
        <Badge variant="secondary" className="font-bold">
          {campers ? campers.length : 0}
        </Badge>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {renderCampers()}
      </div>
    </div>
  );
}

function Kanban() {
  var auth = useAuth();
  var token = auth.token;
  var [board, setBoard] = useState({});
  var [statuses, setStatuses] = useState([]);
  var [loading, setLoading] = useState(true);
  var [draggedCamper, setDraggedCamper] = useState(null);
  var [dragOverStatus, setDragOverStatus] = useState(null);

  useEffect(function() {
    fetchBoard();
  }, [token]);

  function fetchBoard() {
    axios.get(API_URL + '/api/kanban', {
      headers: { Authorization: 'Bearer ' + token }
    }).then(function(response) {
      setBoard(response.data.board);
      setStatuses(response.data.statuses);
      setLoading(false);
    }).catch(function(error) {
      toast.error('Failed to fetch kanban board');
      setLoading(false);
    });
  }

  function handleDragStart(camper, fromStatus) {
    setDraggedCamper({ camper: camper, fromStatus: fromStatus });
  }

  function handleDragOver(e, status) {
    e.preventDefault();
    setDragOverStatus(status);
  }

  function handleDragLeave() {
    setDragOverStatus(null);
  }

  function handleDrop(e, toStatus) {
    e.preventDefault();
    setDragOverStatus(null);
    
    if (!draggedCamper || draggedCamper.fromStatus === toStatus) {
      setDraggedCamper(null);
      return;
    }

    var camper = draggedCamper.camper;
    var fromStatus = draggedCamper.fromStatus;
    
    // Optimistic update
    var newBoard = {};
    var statusKeys = Object.keys(board);
    for (var i = 0; i < statusKeys.length; i++) {
      var key = statusKeys[i];
      newBoard[key] = board[key].slice();
    }
    
    newBoard[fromStatus] = newBoard[fromStatus].filter(function(c) { return c.id !== camper.id; });
    if (!newBoard[toStatus]) newBoard[toStatus] = [];
    newBoard[toStatus].push({ ...camper, status: toStatus });
    
    setBoard(newBoard);
    setDraggedCamper(null);

    axios.put(
      API_URL + '/api/campers/' + camper.id + '/status?status=' + encodeURIComponent(toStatus),
      {},
      { headers: { Authorization: 'Bearer ' + token }}
    ).then(function() {
      toast.success(camper.first_name + ' moved to ' + toStatus);
      if (toStatus === 'Accepted' || toStatus === 'Paid in Full') {
        toast.info('Automated email has been queued');
      }
    }).catch(function() {
      toast.error('Failed to update status');
      fetchBoard();
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  function renderColumns() {
    var columns = [];
    for (var i = 0; i < statuses.length; i++) {
      var status = statuses[i];
      columns.push(
        <KanbanColumn
          key={status}
          status={status}
          campers={board[status] || []}
          isDragOver={dragOverStatus === status}
          onDragOver={function(e) { handleDragOver(e, status); }}
          onDragLeave={handleDragLeave}
          onDrop={function(e) { handleDrop(e, status); }}
          onCamperDragStart={function(e, camper) { handleDragStart(camper, status); }}
        />
      );
    }
    return columns;
  }

  function renderLegend() {
    var items = [];
    for (var i = 0; i < statuses.length; i++) {
      var status = statuses[i];
      var dotClass = HEADER_COLORS[status] || 'bg-gray-500';
      items.push(
        <div key={status} className="flex items-center gap-2">
          <div className={"w-3 h-3 rounded-full " + dotClass} />
          <span className="text-sm">{status}</span>
          {i < statuses.length - 1 && (
            <MoveRight className="w-4 h-4 text-gray-300 ml-2" />
          )}
        </div>
      );
    }
    return items;
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
          {renderColumns()}
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
            {renderLegend()}
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
