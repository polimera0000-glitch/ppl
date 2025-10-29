// src/pages/PaymentCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [message, setMessage] = useState('Processing payment...');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    try {
      // Get payment parameters from URL
      const paymentParams = {};
      for (let [key, value] of searchParams.entries()) {
        paymentParams[key] = value;
      }

      console.log('Payment callback params:', paymentParams);

      // Check if we have payment data
      if (paymentParams.orderId || paymentParams.paymentId || paymentParams.txnId) {
        // Verify payment status with backend
        const orderId = paymentParams.orderId || paymentParams.merchantOrderNo || paymentParams.txnId;
        
        if (orderId) {
          const response = await apiService.getPaymentStatus(orderId);
          
          if (response.success) {
            setPaymentData(response.data);
            
            if (response.data.status === 'completed') {
              setStatus('success');
              setMessage('Payment completed successfully!');
              
              // Redirect to success page after 2 seconds
              setTimeout(() => {
                navigate(`/payment/success/${orderId}`, {
                  state: {
                    paymentResult: response.data,
                    fromCallback: true
                  }
                });
              }, 2000);
            } else if (response.data.status === 'failed') {
              setStatus('failed');
              setMessage('Payment failed. Please try again.');
            } else {
              setStatus('processing');
              setMessage('Payment is being processed...');
              
              // Check again after 3 seconds
              setTimeout(handlePaymentCallback, 3000);
            }
          } else {
            throw new Error('Failed to verify payment status');
          }
        } else {
          throw new Error('No payment identifier found');
        }
      } else {
        // No payment params, might be a direct access
        setStatus('failed');
        setMessage('Invalid payment callback');
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      setStatus('failed');
      setMessage('Error processing payment callback');
    }
  };

  const handleRetry = () => {
    navigate('/competitions');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to confirmation page...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </>
        )}

        {paymentData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Payment Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Order ID:</span> {paymentData.orderId}</p>
              <p><span className="font-medium">Amount:</span> ₹{paymentData.amount}</p>
              <p><span className="font-medium">Status:</span> {paymentData.status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;