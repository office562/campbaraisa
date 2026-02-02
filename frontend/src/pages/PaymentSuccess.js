import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const checkPayment = async (attempts = 0) => {
      try {
        const response = await axios.get(`${API_URL}/api/stripe/status/${sessionId}`);
        setPaymentData(response.data);
        
        if (response.data.payment_status === 'paid') {
          setStatus('success');
        } else if (attempts < 5) {
          setTimeout(() => checkPayment(attempts + 1), 2000);
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Error checking payment:', error);
        if (attempts < 3) {
          setTimeout(() => checkPayment(attempts + 1), 2000);
        } else {
          setStatus('error');
        }
      }
    };

    checkPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#E85D04] animate-spin" />
              <h2 className="font-heading text-2xl font-bold text-[#2D241E] mb-2">
                Processing Payment
              </h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-[#2A9D8F]" />
              <h2 className="font-heading text-2xl font-bold text-[#2D241E] mb-2">
                Payment Successful!
              </h2>
              <p className="text-muted-foreground mb-4">
                Thank you for your payment of ${((paymentData?.amount_total || 0) / 100).toFixed(2)}.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                A confirmation email will be sent to you shortly.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="btn-camp-primary"
                data-testid="go-home-btn"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'pending' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#E9C46A]" />
              <h2 className="font-heading text-2xl font-bold text-[#2D241E] mb-2">
                Payment Processing
              </h2>
              <p className="text-muted-foreground mb-6">
                Your payment is being processed. This may take a few minutes.
                You can safely close this page.
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                data-testid="continue-btn"
              >
                Continue to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-[#E76F51]" />
              <h2 className="font-heading text-2xl font-bold text-[#2D241E] mb-2">
                Something Went Wrong
              </h2>
              <p className="text-muted-foreground mb-6">
                We couldn't verify your payment status. Please check your email for confirmation
                or contact Camp Baraisa for assistance.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="btn-camp-primary"
                data-testid="retry-btn"
              >
                Return to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
