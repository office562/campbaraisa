import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  User, 
  CreditCard, 
  Receipt, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  MapPin
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ParentPortal = () => {
  const { accessToken } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  const [showPayment, setShowPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [feeInfo, setFeeInfo] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/portal/${accessToken}`);
      setData(response.data);
    } catch (err) {
      setError('Invalid or expired link. Please contact Camp Baraisa for assistance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  // Check for payment return
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');
    
    if (sessionId && paymentStatus === 'success') {
      setCheckingPayment(true);
      const checkPayment = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/stripe/status/${sessionId}`);
          if (response.data.payment_status === 'paid') {
            toast.success('Payment successful! Thank you.');
            fetchData();
          } else {
            toast.info('Payment is being processed...');
          }
        } catch (err) {
          console.error('Error checking payment:', err);
        } finally {
          setCheckingPayment(false);
        }
      };
      
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        await checkPayment();
        attempts++;
        if (attempts >= 3) {
          clearInterval(pollInterval);
        }
      }, 2000);
      
      return () => clearInterval(pollInterval);
    } else if (paymentStatus === 'cancelled') {
      toast.info('Payment was cancelled');
    }
  }, [searchParams]);

  const handlePayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;
    
    setProcessingPayment(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/portal/${accessToken}/payment?invoice_id=${selectedInvoice.id}&amount=${parseFloat(paymentAmount)}`,
        {},
        { headers: { origin: window.location.origin }}
      );
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const openPaymentDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount((invoice.amount - invoice.paid_amount).toFixed(2));
    setShowPayment(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[#E76F51]" />
            <h2 className="font-heading text-2xl font-bold text-[#2D241E] mb-2">
              Link Not Found
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-[#2D241E]">Contact Us:</p>
              <p>848.BAR.AISA (227-2472)</p>
              <p>office@campbaraisa.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { parent, campers, invoices, payments } = data;
  const totalBalance = parent.total_balance || 0;
  const totalPaid = parent.total_paid || 0;
  const outstanding = totalBalance - totalPaid;

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col" data-testid="parent-portal">
      {/* Hero Header with Bryce Canyon */}
      <div 
        className="relative h-48 md:h-64 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1605999211498-1a6cf07fc10d?crop=entropy&cs=srgb&fm=jpg&q=85)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D241E] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-4xl mx-auto flex items-end gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_29a6f845-ffbd-497f-b701-7df33de74a66/artifacts/of4shzam_IMG_3441%202.jpg" 
              alt="Camp Baraisa" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white p-2 shadow-lg"
            />
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
                Camp Baraisa
              </h1>
              <p className="text-white/90">The Ultimate Bein Hazmanim Experience</p>
              <p className="text-white/70 text-sm italic">For the serious Ben Torah.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10 -mt-6">
        {/* Checking Payment Banner */}
        {checkingPayment && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="text-blue-800">Verifying your payment...</span>
          </div>
        )}

        {/* Welcome Card */}
        <Card className="card-camp mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#E85D04]/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-[#E85D04]" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-[#2D241E]">
                    Welcome, {parent.father_first_name || parent.first_name || 'Parent'}!
                  </h2>
                  <p className="text-muted-foreground">{parent.email}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {(parent.father_cell || parent.phone) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {parent.father_cell || parent.phone}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground uppercase">Total Balance</p>
              <p className="text-3xl font-bold text-[#2D241E] mt-1">${totalBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground uppercase">Total Paid</p>
              <p className="text-3xl font-bold text-[#2A9D8F] mt-1">${totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="stat-card bg-[#E85D04]/5">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground uppercase">Outstanding</p>
              <p className="text-3xl font-bold text-[#E85D04] mt-1">${outstanding.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Campers */}
        <Card className="card-camp mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Your Campers</CardTitle>
          </CardHeader>
          <CardContent>
            {campers.length > 0 ? (
              <div className="space-y-3">
                {campers.map((camper) => (
                  <div key={camper.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {camper.photo_url ? (
                        <img src={camper.photo_url} alt={camper.first_name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#E85D04]/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-[#E85D04]" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{camper.first_name} {camper.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {camper.grade || 'No grade'} • {camper.yeshiva || 'No yeshiva'}
                        </p>
                      </div>
                    </div>
                    <Badge className={
                      camper.status === 'Paid in Full' ? 'bg-emerald-100 text-emerald-800' :
                      camper.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {camper.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No campers registered</p>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="card-camp mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#E85D04]" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const balance = invoice.amount - invoice.paid_amount;
                  return (
                    <div key={invoice.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-medium">{invoice.description}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Amount: ${invoice.amount.toLocaleString()}</span>
                            <span className="text-[#2A9D8F]">Paid: ${invoice.paid_amount.toLocaleString()}</span>
                            {balance > 0 && (
                              <span className="text-[#E76F51]">Balance: ${balance.toLocaleString()}</span>
                            )}
                          </div>
                          {invoice.due_date && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {invoice.due_date}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={
                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            invoice.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {invoice.status}
                          </Badge>
                          {balance > 0 && (
                            <Button 
                              onClick={() => openPaymentDialog(invoice)}
                              className="btn-camp-primary"
                              data-testid={`pay-invoice-${invoice.id}`}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No invoices</p>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="card-camp mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#E85D04]" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payment.status === 'completed' ? 'bg-emerald-100' : 'bg-yellow-100'
                      }`}>
                        {payment.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{payment.method}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
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
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No payments recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Make a Payment</DialogTitle>
              <DialogDescription>
                Pay for: {selectedInvoice?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Invoice Amount</span>
                  <span className="font-medium">${selectedInvoice?.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="font-medium text-[#2A9D8F]">${selectedInvoice?.paid_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Balance Due</span>
                  <span className="font-bold text-[#E85D04]">
                    ${((selectedInvoice?.amount || 0) - (selectedInvoice?.paid_amount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <Label>Payment Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={(selectedInvoice?.amount || 0) - (selectedInvoice?.paid_amount || 0)}
                  data-testid="payment-amount-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can pay in full or make a partial payment
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handlePayment}
                className="btn-camp-primary w-full"
                disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                data-testid="confirm-payment-btn"
              >
                {processingPayment ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay ${parseFloat(paymentAmount || 0).toFixed(2)}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Footer */}
      <footer className="bg-[#2D241E] text-white py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_29a6f845-ffbd-497f-b701-7df33de74a66/artifacts/of4shzam_IMG_3441%202.jpg" 
                alt="Camp Baraisa" 
                className="w-12 h-12 rounded-lg bg-white p-1"
              />
              <div>
                <h3 className="font-heading text-xl font-bold">Camp Baraisa</h3>
                <p className="text-white/70 text-sm">The Ultimate Bein Hazmanim Experience</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#E85D04]" />
                <span>848.BAR.AISA (227-2472)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#E85D04]" />
                <a href="mailto:office@campbaraisa.com" className="hover:text-[#E85D04] transition-colors">
                  office@campbaraisa.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E85D04]" />
                <span>665 Princeton Ave Apt. 206, Lakewood, NJ 08701</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-6 pt-6 text-center text-sm text-white/60">
            <p>© {new Date().getFullYear()} Camp Baraisa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ParentPortal;
