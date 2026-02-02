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

const COLORS = ['#E85D04', '#F4A261', '#2A9D8F', '#E9C46A', '#264653', '#E76F51'];

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  const getKanbanData = () => {
    if (!stats || !stats.campers_by_status) return [];
    const result = [];
    const entries = Object.keys(stats.campers_by_status);
    for (let i = 0; i < entries.length; i++) {
      const status = entries[i];
      const count = stats.campers_by_status[status];
      if (count > 0) {
        result.push({ name: status, value: count });
      }
    }
    return result;
  };

  const kanbanData = getKanbanData();

  const collectionRate = stats && stats.total_invoiced > 0 
    ? ((stats.total_collected / stats.total_invoiced) * 100).toFixed(1)
    : 0;

  const statusEntries = stats && stats.campers_by_status ? Object.keys(stats.campers_by_status) : [];

  return (
    <div data-testid="dashboard-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening at Camp Baraisa.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card" data-testid="stat-total-campers">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total Campers
                </p>
                <p className="text-3xl font-bold text-[#2D241E] mt-1">
                  {stats?.total_campers || 0}
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
                  ${(stats?.total_invoiced || 0).toLocaleString()}
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
                  ${(stats?.total_collected || 0).toLocaleString()}
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
                  ${(stats?.outstanding || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#E76F51]/10 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-[#E76F51]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Camper Status Summary */}
        <Card className="card-camp">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Enrollment Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {kanbanData.length > 0 ? (
              <div className="space-y-3">
                {kanbanData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div 
                        className="h-full rounded-full flex items-center justify-end px-2 text-xs text-white font-medium"
                        style={{ 
                          width: `${Math.max((item.value / (stats?.total_campers || 1)) * 100, 20)}%`,
                          backgroundColor: COLORS[idx % COLORS.length]
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                    <span className="text-sm font-medium w-32 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No camper data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card className="card-camp">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusEntries.length > 0 ? statusEntries.map((status, idx) => (
                <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{status}</span>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {stats.campers_by_status[status]}
                  </Badge>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-8">No status data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campers */}
        <Card className="card-camp">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-[#E85D04]" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_campers && stats.recent_campers.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_campers.map((camper) => (
                  <div key={camper.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{camper.first_name} {camper.last_name}</p>
                      <p className="text-sm text-muted-foreground">{camper.grade || 'No grade'} • {camper.yeshiva || 'No yeshiva'}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        camper.status === 'Paid in Full' ? 'border-[#2A9D8F] text-[#2A9D8F]' :
                        camper.status === 'Applied' ? 'border-[#E85D04] text-[#E85D04]' :
                        'border-gray-400 text-gray-600'
                      }
                    >
                      {camper.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent applications</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Communications */}
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
                  {stats?.pending_communications || 0}
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
    </div>
  );
};

export default Dashboard;
