// src/components/PaymentComponent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import CustomButton from './CustomButton';
import {
  CreditCard,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  User,
  IndianRupee
} from 'lucide-react';

const PaymentComponent = ({ 
  competitionId, 
  competitionTitle,
  registrationData,
  onPaymentSuccess,
  onPaymentCancel,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const { userType, teamSize = 1, teamName, registrationType } = registrationData;

  // Calculate amount based on user type and team size
  const calculateAmount = () => {
    const pricePerPerson = userType === 'undergraduate' ? 500 : 1000;
    return pricePerPerson * teamSize;
  };

  const amount = calculateAmount();

  useEffect(() => {
    // Create payment order when component mounts
    createPaymentOrder();
  }, []);

  const createPaymentOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        competitionId,
        userType,
        teamSize,
        teamName: registrationType === 'team' ? teamName : undefined
      };

      const response = await apiService.createPaymentOrder(paymentData);
      const orderData = response?.data || response;

      setPaymentOrder(orderData);
      
    } catch (err) {
      console.error('Failed to create payment order:', err);
      setError(err.message || 'Failed to create payment order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentOrder) return;

    try {
      setLoading(true);
      setError(null);

      // For now, simulate payment process
      // In real implementation, this would redirect to payment gateway
      
      // Simulate payment processing
      setTimeout(() => {
        setPaymentStatus('processing');
        
        // Simulate payment completion
        setTimeout(() => {
          setPaymentStatus('completed');
          if (onPaymentSuccess) {
            onPaymentSuccess({
              orderId: paymentOrder.orderId,
              amount: paymentOrder.amount,
              status: 'completed'
            });
          }
        }, 2000);
      }, 1000);

    } catch (err) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onPaymentCancel) {
      onPaymentCancel();
    } else {
      navigate(-1);
    }
  };

  if (paymentStatus === 'completed') {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your registration for {competitionTitle} has been confirmed.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-800 text-sm">
              Order ID: {paymentOrder?.orderId}
            </p>
            <p className="text-green-800 text-sm">
              Amount Paid: ₹{amount}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h2>
          <p className="text-gray-600">
            Please wait while we process your payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <CreditCard className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Complete Payment</h2>
        <p className="text-gray-600 text-sm">
          Complete your registration for {competitionTitle}
        </p>
      </div>

      {/* Registration Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Registration Summary</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Competition:</span>
            <span className="font-medium text-gray-800">{competitionTitle}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <div className="flex items-center gap-1">
              {registrationType === 'team' ? (
                <Users className="w-4 h-4 text-blue-500" />
              ) : (
                <User className="w-4 h-4 text-blue-500" />
              )}
              <span className="font-medium text-gray-800 capitalize">
                {registrationType}
              </span>
            </div>
          </div>

          {registrationType === 'team' && teamName && (
            <div className="flex justify-between">
              <span className="text-gray-600">Team Name:</span>
              <span className="font-medium text-gray-800">{teamName}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium text-gray-800 capitalize">{userType}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Team Size:</span>
            <span className="font-medium text-gray-800">{teamSize} member{teamSize > 1 ? 's' : ''}</span>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount:</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4 text-green-600" />
                <span className="font-bold text-lg text-gray-800">{amount}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ₹{userType === 'undergraduate' ? '500' : '1000'} per person
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Payment Order Info */}
      {paymentOrder && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-blue-800 text-sm">
            Order ID: {paymentOrder.orderId}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <p className="text-blue-700 text-xs">
              Order expires in 30 minutes
            </p>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center gap-2 mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
        <Shield className="w-4 h-4 text-green-600" />
        <p className="text-green-800 text-xs">
          Your payment is secured with bank-grade encryption
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <CustomButton
          text={loading ? 'Processing...' : 'Pay Now'}
          onPressed={handlePayment}
          enabled={!loading && paymentOrder}
          loading={loading}
          variant="primary"
          size="md"
          fullWidth={true}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        />
        
        <CustomButton
          text="Cancel"
          onPressed={handleCancel}
          enabled={!loading}
          variant="outline"
          size="md"
          fullWidth={true}
          className="text-gray-600 border-gray-300 hover:bg-gray-50"
        />
      </div>

      {/* Payment Methods Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 mb-2">We accept</p>
        <div className="flex justify-center items-center gap-2 text-xs text-gray-400">
          <span>Credit Card</span>
          <span>•</span>
          <span>Debit Card</span>
          <span>•</span>
          <span>UPI</span>
          <span>•</span>
          <span>Net Banking</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentComponent;