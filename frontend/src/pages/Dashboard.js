import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Mail, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CHART_COLORS = ['#E85D04', '#F4A261', '#2A9D8F', '#E9C46A', '#264653', '#E76F51'];

function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    async function fetchStats() {
      try {
        const response = await axios.get(API_URL + '/api/dashboard/stats', {
          headers: { Authorization: 'Bearer ' + token }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  const totalCampers = stats ? stats.total_campers : 0;
  const totalInvoiced = stats ? stats.total_invoiced : 0;
  const totalCollected = stats ? stats.total_collected : 0;
  const outstanding = stats ? stats.outstanding : 0;
  const pendingComms = stats ? stats.pending_communications : 0;
  
  const collectionRate = totalInvoiced > 0 
    ? ((totalCollected / totalInvoiced) * 100).toFixed(1)
    : 0;

  function renderStatusList() {
    if (!stats || !stats.campers_by_status) {
      return <p className="text-center text-muted-foreground py-8">No status data available</p>;
    }
    const statusKeys = Object.keys(stats.campers_by_status);
    const items = [];
    for (let i = 0; i < statusKeys.length; i++) {
      const status = statusKeys[i];
      const count = stats.campers_by_status[status];
      items.push(
        <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-sm font-medium">{status}</span>
          </div>
          <Badge variant="secondary" className="font-bold">
            {count}
          </Badge>
        </div>
      );
    }
    return items;
  }

  function renderRecentCampers() {
    if (!stats || !stats.recent_campers || stats.recent_campers.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No recent applications</p>;
    }
    const items = [];
    for (let i = 0; i < stats.recent_campers.length; i++) {
      const camper = stats.recent_campers[i];
      const statusClass = camper.status === 'Paid in Full' 
        ? 'border-[#2A9D8F] text-[#2A9D8F]' 
        : camper.status === 'Applied' 
          ? 'border-[#E85D04] text-[#E85D04]' 
          : 'border-gray-400 text-gray-600';
      items.push(
        <div key={camper.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">{camper.first_name} {camper.last_name}</p>
            <p className="text-sm text-muted-foreground">{camper.grade || 'No grade'} • {camper.yeshiva || 'No yeshiva'}</p>
          </div>
          <Badge variant="outline" className={statusClass}>
            {camper.status}
          </Badge>
        </div>
      );
    }
    return items;
  }

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening at Camp Baraisa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card" data-testid="stat-total-campers">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total Campers
                </p>
                <p className="text-3xl font-bold text-[#2D241E] mt-1">
                  {totalCampers}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#E85D04]/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#E85D04]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-total-invoiced">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total Invoiced
                </p>
                <p className="text-3xl font-bold text-[#2D241E] mt-1">
                  ${totalInvoiced.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#F4A261]/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#F4A261]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-total-collected">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total Collected
                </p>
                <p className="text-3xl font-bold text-[#2A9D8F] mt-1">
                  ${totalCollected.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <ArrowUpRight className="w-3 h-3 text-[#2A9D8F] mr-1" />
                  {collectionRate}% collection rate
                </p>
              </div>
              <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#2A9D8F]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-outstanding">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Outstanding
                </p>
                <p className="text-3xl font-bold text-[#E76F51] mt-1">
                  ${outstanding.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#E76F51]/10 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-[#E76F51]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="card-camp">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {renderStatusList()}
            </div>
          </CardContent>
        </Card>

        <Card className="card-camp">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-[#E85D04]" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {renderRecentCampers()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-camp">
        <CardHeader>
          <CardTitle className="font-heading text-xl flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#E85D04]" />
            Communications Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 bg-[#E85D04]/5 rounded-xl">
            <div>
              <p className="text-4xl font-bold text-[#E85D04]">
                {pendingComms}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Pending emails to send
              </p>
            </div>
            <Mail className="w-12 h-12 text-[#E85D04]/30" />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Configure Gmail/Twilio in Settings to enable sending
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
