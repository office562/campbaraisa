import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Download, 
  Users, 
  Receipt,
  UserCircle,
  FileSpreadsheet,
  CheckCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const exportTypes = [
  {
    id: 'campers',
    title: 'Campers Export',
    description: 'Export all camper data including names, grades, yeshivas, and parent info',
    icon: Users,
    endpoint: '/api/exports/campers',
    color: 'bg-blue-500'
  },
  {
    id: 'billing',
    title: 'Billing Export',
    description: 'Export all invoices with payment status, amounts, and due dates',
    icon: Receipt,
    endpoint: '/api/exports/billing',
    color: 'bg-green-500'
  },
  {
    id: 'parents',
    title: 'Parents Export',
    description: 'Export parent contact information and balances',
    icon: UserCircle,
    endpoint: '/api/exports/parents',
    color: 'bg-purple-500'
  }
];

const Exports = () => {
  const { token } = useAuth();
  const [exporting, setExporting] = useState({});
  const [exported, setExported] = useState({});

  const handleExport = async (exportType) => {
    setExporting({ ...exporting, [exportType.id]: true });
    try {
      const response = await axios.get(`${API_URL}${exportType.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { data, filename } = response.data;
      
      if (data.length === 0) {
        toast.info('No data to export');
        setExporting({ ...exporting, [exportType.id]: false });
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExported({ ...exported, [exportType.id]: true });
      toast.success(`${exportType.title} downloaded successfully`);
      
      // Reset exported status after 3 seconds
      setTimeout(() => {
        setExported({ ...exported, [exportType.id]: false });
      }, 3000);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting({ ...exporting, [exportType.id]: false });
    }
  };

  return (
    <div data-testid="exports-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
          Exports
        </h1>
        <p className="text-muted-foreground mt-1">
          Download data exports in CSV format
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportTypes.map((exportType) => (
          <Card key={exportType.id} className="card-camp hover:shadow-lg transition-shadow" data-testid={`export-${exportType.id}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${exportType.color} flex items-center justify-center`}>
                  <exportType.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="font-heading text-lg">{exportType.title}</CardTitle>
                </div>
              </div>
              <CardDescription className="mt-2">
                {exportType.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className={`w-full ${exported[exportType.id] ? 'btn-camp-secondary' : 'btn-camp-primary'}`}
                onClick={() => handleExport(exportType)}
                disabled={exporting[exportType.id]}
                data-testid={`export-${exportType.id}-btn`}
              >
                {exporting[exportType.id] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : exported[exportType.id] ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Downloaded
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="card-camp mt-8">
        <CardHeader>
          <CardTitle className="font-heading text-xl flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#E85D04]" />
            Export Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E85D04] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">CSV Format</p>
                <p className="text-sm text-muted-foreground">
                  All exports are in CSV (Comma-Separated Values) format, compatible with Excel, Google Sheets, and other spreadsheet applications.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E85D04] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Open in Excel</p>
                <p className="text-sm text-muted-foreground">
                  After downloading, double-click the file to open in Excel or import via Data → From Text/CSV in newer versions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E85D04] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Data Privacy</p>
                <p className="text-sm text-muted-foreground">
                  Exported data contains sensitive information. Please handle files securely and delete after use if not needed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Exports;
