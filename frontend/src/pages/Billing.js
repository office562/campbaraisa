import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  DollarSign,
  Send,
  Receipt,
  CreditCard,
  Banknote,
  Building
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const paymentMethods = [
  { value: 'stripe', label: 'Credit Card (Stripe)', icon: CreditCard },
  { value: 'check', label: 'Check', icon: Receipt },
  { value: 'zelle', label: 'Zelle', icon: Building },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'other', label: 'Other', icon: DollarSign },
];

const Billing = () => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [parents, setParents] = useState([]);
  const [campers, setCampers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    parent_id: '', camper_id: '', amount: '', description: '', due_date: ''
  });
  const [newPayment, setNewPayment] = useState({
    invoice_id: '', amount: '', method: 'check', notes: ''
  });

  const fetchData = async () => {
    try {
      const [invoicesRes, paymentsRes, parentsRes, campersRes] = await Promise.all([
        axios.get(`${API_URL}/api/invoices`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/payments`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/parents`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/campers`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setInvoices(invoicesRes.data);
      setPayments(paymentsRes.data);
      setParents(parentsRes.data);
      setCampers(campersRes.data);
    } catch (error) {
      toast.error('Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/invoices`, {
        ...newInvoice,
        amount: parseFloat(newInvoice.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices([...invoices, response.data]);
      setShowAddInvoice(false);
      setNewInvoice({ parent_id: '', camper_id: '', amount: '', description: '', due_date: '' });
      toast.success('Invoice created successfully');
      fetchData(); // Refresh to update parent balances
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/payments`, {
        ...newPayment,
        amount: parseFloat(newPayment.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments([...payments, response.data]);
      setShowAddPayment(false);
      setNewPayment({ invoice_id: '', amount: '', method: 'check', notes: '' });
      toast.success('Payment recorded successfully');
      fetchData(); // Refresh
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const getParentName = (parentId) => {
    const parent = parents.find(p => p.id === parentId);
    return parent ? `${parent.first_name} ${parent.last_name}` : 'Unknown';
  };

  const getCamperName = (camperId) => {
    const camper = campers.find(c => c.id === camperId);
    return camper ? `${camper.first_name} ${camper.last_name}` : 'Unknown';
  };

  const getParentCampers = (parentId) => {
    return campers.filter(c => c.parent_id === parentId);
  };

  // Calculate summary stats
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalPending = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount - inv.paid_amount, 0);

  const filteredInvoices = invoices.filter(invoice => {
    const parentName = getParentName(invoice.parent_id).toLowerCase();
    const matchesSearch = parentName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="billing-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Billing
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage invoices and track payments
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
            <DialogTrigger asChild>
              <Button variant="outline" className="btn-camp-outline" data-testid="record-payment-btn">
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Record Payment</DialogTitle>
                <DialogDescription>Record a manual payment (check, Zelle, cash)</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <Label>Invoice</Label>
                  <Select
                    value={newPayment.invoice_id}
                    onValueChange={(value) => setNewPayment({...newPayment, invoice_id: value})}
                  >
                    <SelectTrigger data-testid="payment-invoice-select">
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.filter(inv => inv.status !== 'paid').map(invoice => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {getParentName(invoice.parent_id)} - ${invoice.amount - invoice.paid_amount} due
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    required
                    data-testid="payment-amount"
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={newPayment.method}
                    onValueChange={(value) => setNewPayment({...newPayment, method: value})}
                  >
                    <SelectTrigger data-testid="payment-method-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.filter(m => m.value !== 'stripe').map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                    placeholder="Check #, reference, etc."
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="btn-camp-primary" data-testid="save-payment-btn">
                    Record Payment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddInvoice} onOpenChange={setShowAddInvoice}>
            <DialogTrigger asChild>
              <Button className="btn-camp-primary" data-testid="create-invoice-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Create Invoice</DialogTitle>
                <DialogDescription>Create a new invoice for a family</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddInvoice} className="space-y-4">
                <div>
                  <Label>Parent/Family</Label>
                  <Select
                    value={newInvoice.parent_id}
                    onValueChange={(value) => setNewInvoice({...newInvoice, parent_id: value, camper_id: ''})}
                  >
                    <SelectTrigger data-testid="invoice-parent-select">
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map(parent => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.first_name} {parent.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Camper</Label>
                  <Select
                    value={newInvoice.camper_id}
                    onValueChange={(value) => setNewInvoice({...newInvoice, camper_id: value})}
                    disabled={!newInvoice.parent_id}
                  >
                    <SelectTrigger data-testid="invoice-camper-select">
                      <SelectValue placeholder="Select camper" />
                    </SelectTrigger>
                    <SelectContent>
                      {getParentCampers(newInvoice.parent_id).map(camper => (
                        <SelectItem key={camper.id} value={camper.id}>
                          {camper.first_name} {camper.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                    required
                    data-testid="invoice-amount"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newInvoice.description}
                    onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                    placeholder="Summer 2026 Camp Fee"
                    required
                    data-testid="invoice-description"
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="btn-camp-primary" disabled={!newInvoice.parent_id || !newInvoice.camper_id} data-testid="save-invoice-btn">
                    Create Invoice
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card" data-testid="stat-invoiced">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Invoiced</p>
            <p className="text-3xl font-bold text-[#2D241E] mt-1">${totalInvoiced.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-collected">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Collected</p>
            <p className="text-3xl font-bold text-[#2A9D8F] mt-1">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-pending">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
            <p className="text-3xl font-bold text-[#E9C46A] mt-1">${totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-families">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Families</p>
            <p className="text-3xl font-bold text-[#264653] mt-1">{parents.length}</p>
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
                placeholder="Search by parent name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="billing-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="billing-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="card-camp">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent</TableHead>
                <TableHead>Camper</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{getParentName(invoice.parent_id)}</TableCell>
                    <TableCell>{getCamperName(invoice.camper_id)}</TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[#2A9D8F]">${invoice.paid_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[#E76F51]">
                      ${(invoice.amount - invoice.paid_amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        invoice.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.due_date || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="card-camp mt-6">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 10).map((payment) => {
                const invoice = invoices.find(inv => inv.id === payment.invoice_id);
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice ? getParentName(invoice.parent_id) : 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground capitalize">{payment.method} • {payment.notes || 'No notes'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#2A9D8F]">${payment.amount.toLocaleString()}</p>
                      <Badge variant="outline" className={
                        payment.status === 'completed' ? 'border-emerald-500 text-emerald-600' :
                        'border-yellow-500 text-yellow-600'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
