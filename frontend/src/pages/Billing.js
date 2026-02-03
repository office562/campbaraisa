import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Receipt,
  CreditCard,
  Banknote,
  Building,
  Trash2,
  Edit,
  Settings,
  Percent,
  Tag,
  Send,
  Eye,
  Clock,
  Calendar,
  RotateCcw
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_CAMP_FEE = 3475;

const paymentMethods = [
  { value: 'stripe', label: 'Credit Card (3.5% fee)', icon: CreditCard },
  { value: 'check', label: 'Check', icon: Receipt },
  { value: 'zelle', label: 'Zelle', icon: Building },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'other', label: 'Other', icon: DollarSign },
];

function Billing() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [campers, setCampers] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showManageFees, setShowManageFees] = useState(false);
  
  // Invoice form
  const [selectedCamper, setSelectedCamper] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]);
  const [customAmount, setCustomAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [lunchFormDiscount, setLunchFormDiscount] = useState({ type: 'fixed', value: '' });
  
  // Payment form
  const [newPayment, setNewPayment] = useState({
    invoice_id: '', amount: '', method: 'check', notes: ''
  });
  
  // Fee management
  const [newFee, setNewFee] = useState({ name: '', amount: '', description: '' });
  const [editingFee, setEditingFee] = useState(null);
  
  // Stripe checkout state
  const [showStripeDialog, setShowStripeDialog] = useState(false);
  const [stripeInvoice, setStripeInvoice] = useState(null);
  const [stripeAmount, setStripeAmount] = useState('');
  const [processingStripe, setProcessingStripe] = useState(false);
  
  // Installment setup
  const [showInstallmentDialog, setShowInstallmentDialog] = useState(false);
  const [installmentInvoice, setInstallmentInvoice] = useState(null);
  const [numInstallments, setNumInstallments] = useState(3);
  
  // View invoice detail
  const [viewingInvoice, setViewingInvoice] = useState(null);
  
  // Deleted invoices
  const [showTrash, setShowTrash] = useState(false);
  const [deletedInvoices, setDeletedInvoices] = useState([]);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [invoicesRes, paymentsRes, campersRes, feesRes] = await Promise.all([
        axios.get(`${API_URL}/api/invoices`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/payments`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/campers`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/fees`, { headers: { Authorization: `Bearer ${token}` }}).catch(() => ({ data: [] }))
      ]);
      setInvoices(invoicesRes.data);
      setPayments(paymentsRes.data);
      setCampers(campersRes.data);
      setFees(feesRes.data || []);
    } catch (error) {
      toast.error('Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate invoice total
  const calculateTotal = () => {
    let total = 0;
    
    // Add selected fees
    selectedFees.forEach(feeId => {
      const fee = fees.find(f => f.id === feeId);
      if (fee) total += fee.amount;
    });
    
    // Add custom amount
    if (customAmount) {
      total += parseFloat(customAmount) || 0;
    }
    
    // Apply discount
    if (discountValue) {
      const discount = parseFloat(discountValue) || 0;
      if (discountType === 'percent') {
        total -= total * (discount / 100);
      } else {
        total -= discount;
      }
    }
    
    // Apply lunch form discount
    if (lunchFormDiscount.value) {
      const discount = parseFloat(lunchFormDiscount.value) || 0;
      if (lunchFormDiscount.type === 'percent') {
        total -= total * (discount / 100);
      } else {
        total -= discount;
      }
    }
    
    return Math.max(0, total);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedCamper) {
      toast.error('Please select a camper');
      return;
    }
    
    const total = calculateTotal();
    if (total <= 0) {
      toast.error('Invoice amount must be greater than 0');
      return;
    }
    
    // Build description
    let description = invoiceDescription;
    if (!description) {
      const feeNames = selectedFees.map(feeId => fees.find(f => f.id === feeId)?.name).filter(Boolean);
      description = feeNames.join(', ') || 'Invoice';
    }
    
    try {
      await axios.post(`${API_URL}/api/invoices`, {
        camper_id: selectedCamper.id,
        amount: total,
        description,
        due_date: invoiceDueDate || null,
        fees_applied: selectedFees,
        discount_type: discountValue ? discountType : null,
        discount_value: discountValue ? parseFloat(discountValue) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Invoice created');
      setShowAddInvoice(false);
      resetInvoiceForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const resetInvoiceForm = () => {
    setSelectedCamper(null);
    // Auto-select the default camp fee
    const defaultFee = fees.find(f => f.is_default);
    setSelectedFees(defaultFee ? [defaultFee.id] : []);
    setCustomAmount('');
    setInvoiceDescription('');
    setInvoiceDueDate('');
    setDiscountType('fixed');
    setDiscountValue('');
    setLunchFormDiscount({ type: 'fixed', value: '' });
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/payments`, {
        ...newPayment,
        amount: parseFloat(newPayment.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment recorded');
      setShowAddPayment(false);
      setNewPayment({ invoice_id: '', amount: '', method: 'check', notes: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleAddFee = async () => {
    if (!newFee.name || !newFee.amount) {
      toast.error('Please enter fee name and amount');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/fees`, {
        name: newFee.name,
        amount: parseFloat(newFee.amount),
        description: newFee.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Fee added');
      setNewFee({ name: '', amount: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add fee');
    }
  };

  const handleDeleteFee = async (feeId) => {
    try {
      await axios.delete(`${API_URL}/api/fees/${feeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      toast.success('Fee deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Cannot delete this fee');
    }
  };

  const handleUpdateFee = async () => {
    if (!editingFee) return;
    try {
      await axios.put(`${API_URL}/api/fees/${editingFee.id}`, {
        name: editingFee.name,
        amount: parseFloat(editingFee.amount),
        description: editingFee.description || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      setEditingFee(null);
      toast.success('Fee updated');
    } catch (error) {
      toast.error('Failed to update fee');
    }
  };

  // Stripe checkout handler
  const handleStripeCheckout = async () => {
    if (!stripeInvoice || !stripeAmount) {
      toast.error('Please select an invoice and enter amount');
      return;
    }
    
    setProcessingStripe(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/stripe/checkout?invoice_id=${stripeInvoice.id}&amount=${parseFloat(stripeAmount)}&origin_url=${window.location.origin}&include_fee=true`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error('Failed to initiate Stripe checkout');
    } finally {
      setProcessingStripe(false);
    }
  };

  const openStripeDialog = (invoice) => {
    setStripeInvoice(invoice);
    const balance = (invoice.amount - invoice.paid_amount).toFixed(2);
    setStripeAmount(balance);
    setShowStripeDialog(true);
  };

  // Calculate Stripe fee
  const calculateStripeFee = () => {
    const amount = parseFloat(stripeAmount) || 0;
    const fee = amount * 0.035;
    return { base: amount, fee: fee, total: amount + fee };
  };

  const getCamperName = (camperId) => {
    const camper = campers.find(c => c.id === camperId);
    return camper ? `${camper.first_name} ${camper.last_name}` : 'Unknown';
  };

  const getParentName = (camper) => {
    if (!camper) return '';
    const first = camper.father_first_name || camper.mother_first_name || '';
    const last = camper.father_last_name || camper.mother_last_name || '';
    return `${first} ${last}`.trim();
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Move this invoice to trash?')) return;
    try {
      await axios.delete(`${API_URL}/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice moved to trash');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  // Send invoice
  const handleSendInvoice = async (invoiceId) => {
    try {
      await axios.post(`${API_URL}/api/invoices/${invoiceId}/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice marked as sent');
      fetchData();
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  // Setup installments
  const handleSetupInstallments = async () => {
    if (!installmentInvoice) return;
    try {
      await axios.post(`${API_URL}/api/invoices/${installmentInvoice.id}/installments`, {
        num_installments: numInstallments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Installment plan created');
      setShowInstallmentDialog(false);
      setInstallmentInvoice(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to create installment plan');
    }
  };

  // Fetch deleted invoices
  const fetchDeletedInvoices = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/invoices/trash/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletedInvoices(res.data || []);
      setShowTrash(true);
    } catch (error) {
      toast.error('Failed to load deleted invoices');
    }
  };

  // Restore invoice
  const handleRestoreInvoice = async (invoiceId) => {
    try {
      await axios.post(`${API_URL}/api/invoices/${invoiceId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice restored');
      fetchDeletedInvoices();
      fetchData();
    } catch (error) {
      toast.error('Failed to restore invoice');
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      partial: 'bg-amber-100 text-amber-800',
      paid: 'bg-emerald-100 text-emerald-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Search filter - searches by camper name, parent name, or last name
  const filteredInvoices = invoices.filter(invoice => {
    const camper = campers.find(c => c.id === invoice.camper_id);
    const camperName = camper ? `${camper.first_name} ${camper.last_name}`.toLowerCase() : '';
    const parentName = camper ? getParentName(camper).toLowerCase() : '';
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = !searchTerm || 
      camperName.includes(search) || 
      parentName.includes(search);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Search campers for invoice creation
  const [camperSearch, setCamperSearch] = useState('');
  const searchedCampers = campers.filter(c => {
    if (!camperSearch) return true;
    const search = camperSearch.toLowerCase();
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    const parentName = getParentName(c).toLowerCase();
    return name.includes(search) || parentName.includes(search);
  });

  // Stats
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalPending = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount - inv.paid_amount, 0);

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
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">Manage invoices, fees, and payments</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowManageFees(true)}>
            <Settings className="w-4 h-4 mr-2" /> Manage Fees
          </Button>
          <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
            <DialogTrigger asChild>
              <Button variant="outline" className="btn-camp-outline">
                <DollarSign className="w-4 h-4 mr-2" /> Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>Record a manual payment</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <Label>Invoice</Label>
                  <Select value={newPayment.invoice_id} onValueChange={(v) => setNewPayment({...newPayment, invoice_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                    <SelectContent>
                      {invoices.filter(inv => inv.status !== 'paid').map(inv => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {getCamperName(inv.camper_id)} - ${(inv.amount - inv.paid_amount).toLocaleString()} due
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount ($)</Label>
                  <Input type="number" step="0.01" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} required />
                </div>
                <div>
                  <Label>Method</Label>
                  <Select value={newPayment.method} onValueChange={(v) => setNewPayment({...newPayment, method: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={newPayment.notes} onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})} placeholder="Check #, reference" />
                </div>
                <DialogFooter>
                  <Button type="submit" className="btn-camp-primary">Record Payment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button className="btn-camp-primary" onClick={() => { resetInvoiceForm(); setShowAddInvoice(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Total Invoiced</p>
            <p className="text-3xl font-bold text-[#2D241E] mt-1">${totalInvoiced.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Collected</p>
            <p className="text-3xl font-bold text-[#2A9D8F] mt-1">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Outstanding</p>
            <p className="text-3xl font-bold text-[#E76F51] mt-1">${totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Invoices</p>
            <p className="text-3xl font-bold text-[#264653] mt-1">{invoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="card-camp mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by camper name, parent name, or last name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDeletedInvoices}>
              <Trash2 className="w-4 h-4 mr-2" />Trash
            </Button>
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
                <TableHead>#</TableHead>
                <TableHead>Camper</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => {
                const camper = campers.find(c => c.id === invoice.camper_id);
                const balance = invoice.amount - invoice.paid_amount;
                return (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">{invoice.invoice_number || invoice.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{getCamperName(invoice.camper_id)}</TableCell>
                    <TableCell>{camper ? getParentName(camper) : '-'}</TableCell>
                    <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[#2A9D8F]">${(invoice.paid_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[#E76F51]">${balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(invoice.status)}>{invoice.status || 'draft'}</Badge>
                      {invoice.installment_plan && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          <Calendar className="w-3 h-3 mr-1" />Plan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{invoice.due_date || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {invoice.status === 'draft' && (
                          <Button variant="ghost" size="sm" onClick={() => handleSendInvoice(invoice.id)} title="Send Invoice">
                            <Send className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {balance > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => openStripeDialog(invoice)} title="Charge Card">
                            <CreditCard className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {balance > 0 && !invoice.installment_plan && (
                          <Button variant="ghost" size="sm" onClick={() => { setInstallmentInvoice(invoice); setShowInstallmentDialog(true); }} title="Setup Installments">
                            <Clock className="w-4 h-4 text-purple-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setViewingInvoice(invoice)} title="View Details">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(invoice.id)} title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No invoices found</TableCell>
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
              {payments.slice(0, 10).map(payment => {
                const invoice = invoices.find(inv => inv.id === payment.invoice_id);
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice ? getCamperName(invoice.camper_id) : 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground capitalize">{payment.method} • {payment.notes || 'No notes'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#2A9D8F]">${payment.amount.toLocaleString()}</p>
                      <Badge variant="outline" className={payment.status === 'completed' ? 'border-emerald-500 text-emerald-600' : 'border-yellow-500 text-yellow-600'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payments recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={showAddInvoice} onOpenChange={setShowAddInvoice}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Create Invoice</DialogTitle>
            <DialogDescription>Select a camper and add fees</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-6">
            {/* Camper Selection */}
            <div>
              <Label>Search Camper *</Label>
              <Input
                placeholder="Search by camper or parent name..."
                value={camperSearch}
                onChange={(e) => setCamperSearch(e.target.value)}
                className="mb-2"
              />
              {!selectedCamper && (
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {searchedCampers.slice(0, 10).map(camper => (
                    <div
                      key={camper.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                      onClick={() => { setSelectedCamper(camper); setCamperSearch(''); }}
                    >
                      <p className="font-medium">{camper.first_name} {camper.last_name}</p>
                      <p className="text-sm text-muted-foreground">Parent: {getParentName(camper)}</p>
                    </div>
                  ))}
                </div>
              )}
              {selectedCamper && (
                <div className="bg-[#E85D04]/10 border border-[#E85D04] rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedCamper.first_name} {selectedCamper.last_name}</p>
                    <p className="text-sm text-muted-foreground">Parent: {getParentName(selectedCamper)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCamper(null)}>Change</Button>
                </div>
              )}
            </div>

            {/* Fee Selection */}
            <div>
              <Label className="mb-2 block">Select Fees</Label>
              <div className="space-y-2">
                {fees.map(fee => (
                  <div
                    key={fee.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors ${selectedFees.includes(fee.id) ? 'bg-[#E85D04]/10 border-[#E85D04]' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                    onClick={() => {
                      if (selectedFees.includes(fee.id)) {
                        setSelectedFees(selectedFees.filter(id => id !== fee.id));
                      } else {
                        setSelectedFees([...selectedFees, fee.id]);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedFees.includes(fee.id)} 
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFees([...selectedFees, fee.id]);
                          } else {
                            setSelectedFees(selectedFees.filter(id => id !== fee.id));
                          }
                        }}
                        className="pointer-events-none"
                      />
                      <div>
                        <p className="font-medium">{fee.name}</p>
                        {fee.description && <p className="text-sm text-muted-foreground">{fee.description}</p>}
                      </div>
                    </div>
                    <p className="font-bold">${fee.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <Label>Additional Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount</Label>
                <div className="flex gap-2">
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">$ Fixed</SelectItem>
                      <SelectItem value="percent">% Percent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Lunch Form Discount</Label>
                <div className="flex gap-2">
                  <Select value={lunchFormDiscount.type} onValueChange={(v) => setLunchFormDiscount({...lunchFormDiscount, type: v})}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">$ Fixed</SelectItem>
                      <SelectItem value="percent">% Percent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={lunchFormDiscount.value}
                    onChange={(e) => setLunchFormDiscount({...lunchFormDiscount, value: e.target.value})}
                    placeholder="0"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Description & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Description</Label>
                <Input
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  placeholder="Auto-generated from fees"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Invoice Total:</span>
                <span className="text-2xl font-bold text-[#E85D04]">${calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddInvoice(false)}>Cancel</Button>
              <Button type="submit" className="btn-camp-primary" disabled={!selectedCamper}>Create Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Fees Dialog */}
      <Dialog open={showManageFees} onOpenChange={(open) => { setShowManageFees(open); if (!open) setEditingFee(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Manage Fees</DialogTitle>
            <DialogDescription>Add, edit, or remove fees that can be applied to invoices</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add New Fee */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium mb-3">Add New Fee</p>
              <div className="space-y-3">
                <Input
                  placeholder="Fee Name (e.g., Transportation)"
                  value={newFee.name}
                  onChange={(e) => setNewFee({...newFee, name: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Amount ($)"
                  value={newFee.amount}
                  onChange={(e) => setNewFee({...newFee, amount: e.target.value})}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newFee.description}
                  onChange={(e) => setNewFee({...newFee, description: e.target.value})}
                />
                <Button onClick={handleAddFee} className="btn-camp-primary w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Fee
                </Button>
              </div>
            </div>

            {/* Existing Fees */}
            <div>
              <p className="font-medium mb-3">Existing Fees</p>
              <div className="space-y-2">
                {fees.map(fee => (
                  <div key={fee.id} className="p-3 bg-gray-50 rounded-lg">
                    {editingFee && editingFee.id === fee.id ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Fee Name"
                          value={editingFee.name}
                          onChange={(e) => setEditingFee({...editingFee, name: e.target.value})}
                        />
                        <Input
                          type="number"
                          placeholder="Amount ($)"
                          value={editingFee.amount}
                          onChange={(e) => setEditingFee({...editingFee, amount: e.target.value})}
                        />
                        <Input
                          placeholder="Description"
                          value={editingFee.description || ''}
                          onChange={(e) => setEditingFee({...editingFee, description: e.target.value})}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateFee} className="btn-camp-primary">Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingFee(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{fee.name}</p>
                            {fee.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">${fee.amount.toLocaleString()}</p>
                          {fee.description && <p className="text-xs text-muted-foreground mt-1">{fee.description}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => setEditingFee({ ...fee })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!fee.is_default && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700" 
                              onClick={() => handleDeleteFee(fee.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stripe Checkout Dialog */}
      <Dialog open={showStripeDialog} onOpenChange={setShowStripeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#E85D04]" />
              Charge Credit Card
            </DialogTitle>
            <DialogDescription>
              Process a credit card payment for {stripeInvoice ? getCamperName(stripeInvoice.camper_id) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {stripeInvoice && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Invoice Amount</span>
                  <span className="font-medium">${stripeInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="font-medium text-[#2A9D8F]">${stripeInvoice.paid_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Balance Due</span>
                  <span className="font-bold text-[#E85D04]">
                    ${(stripeInvoice.amount - stripeInvoice.paid_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            <div>
              <Label>Payment Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={stripeAmount}
                onChange={(e) => setStripeAmount(e.target.value)}
                max={stripeInvoice ? (stripeInvoice.amount - stripeInvoice.paid_amount) : 0}
                data-testid="stripe-amount-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter full balance or partial payment amount
              </p>
            </div>
            
            {/* Fee Breakdown */}
            {stripeAmount && parseFloat(stripeAmount) > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  Credit Card Processing Fee (3.5%)
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Payment Amount:</span>
                    <span className="font-medium">${calculateStripeFee().base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Processing Fee (3.5%):</span>
                    <span className="font-medium">+ ${calculateStripeFee().fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                    <span className="font-medium text-amber-900">Total Charge:</span>
                    <span className="font-bold text-amber-900">${calculateStripeFee().total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowStripeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStripeCheckout}
              className="btn-camp-primary"
              disabled={processingStripe || !stripeAmount || parseFloat(stripeAmount) <= 0}
              data-testid="process-stripe-btn"
            >
              {processingStripe ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Charge ${stripeAmount ? calculateStripeFee().total.toFixed(2) : '0.00'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Installments Dialog */}
      <Dialog open={showInstallmentDialog} onOpenChange={setShowInstallmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#E85D04]" />
              Setup Installment Plan
            </DialogTitle>
            <DialogDescription>
              Split the balance into multiple payments
            </DialogDescription>
          </DialogHeader>
          {installmentInvoice && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Amount</span>
                  <span className="font-medium">${installmentInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="font-medium text-[#2A9D8F]">${(installmentInvoice.paid_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-medium">Balance to Split</span>
                  <span className="font-bold text-[#E85D04]">
                    ${(installmentInvoice.amount - (installmentInvoice.paid_amount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <Label>Number of Installments</Label>
                <Select value={numInstallments.toString()} onValueChange={(v) => setNumInstallments(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Payments</SelectItem>
                    <SelectItem value="3">3 Payments</SelectItem>
                    <SelectItem value="4">4 Payments</SelectItem>
                    <SelectItem value="5">5 Payments</SelectItem>
                    <SelectItem value="6">6 Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Each payment: ${((installmentInvoice.amount - (installmentInvoice.paid_amount || 0)) / numInstallments).toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Payments will be scheduled monthly starting from the due date
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallmentDialog(false)}>Cancel</Button>
            <Button onClick={handleSetupInstallments} className="btn-camp-primary">
              <Clock className="w-4 h-4 mr-2" />Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Invoice Details</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice #</Label>
                  <p className="font-mono">{viewingInvoice.invoice_number || viewingInvoice.id.slice(0, 8)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={getStatusBadge(viewingInvoice.status)}>{viewingInvoice.status}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Camper</Label>
                  <p className="font-medium">{getCamperName(viewingInvoice.camper_id)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p>{viewingInvoice.due_date || 'Not set'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">${viewingInvoice.amount.toLocaleString()}</span>
                </div>
                {viewingInvoice.discount_amount > 0 && (
                  <div className="flex justify-between py-1 text-green-600">
                    <span>Discount</span>
                    <span>-${viewingInvoice.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-[#2A9D8F]">${(viewingInvoice.paid_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-t font-bold">
                  <span>Balance Due</span>
                  <span className="text-[#E85D04]">${(viewingInvoice.amount - (viewingInvoice.paid_amount || 0)).toLocaleString()}</span>
                </div>
              </div>

              {viewingInvoice.installment_plan && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">Installment Plan</Label>
                  <div className="space-y-2">
                    {viewingInvoice.installment_plan.schedule.map((inst, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Payment {inst.installment_number} - {inst.due_date}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${inst.amount.toFixed(2)}</span>
                          <Badge className={inst.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>{inst.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingInvoice.notes && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1">{viewingInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Trash Dialog */}
      <Dialog open={showTrash} onOpenChange={setShowTrash}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-600" />
              Deleted Invoices
            </DialogTitle>
            <DialogDescription>Restore or permanently delete invoices</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {deletedInvoices.length > 0 ? (
              <div className="space-y-2">
                {deletedInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{inv.invoice_number || inv.id.slice(0, 8)} - {getCamperName(inv.camper_id)}</p>
                      <p className="text-sm text-muted-foreground">${inv.amount.toLocaleString()} - {inv.description}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleRestoreInvoice(inv.id)}>
                      <RotateCcw className="w-4 h-4 mr-1" />Restore
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No deleted invoices</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Billing;
