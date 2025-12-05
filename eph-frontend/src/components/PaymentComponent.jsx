// src/components/PaymentComponent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import CustomButton from './CustomButton';
import { trackPaymentInitiated, trackPayment } from '../services/analytics';
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
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const { userType, teamSize = 1, teamName, registrationType } = registrationData;

  // Calculate amount based on user type and team size
  const calculateAmount = () => {
    const pricePerPerson = userType === 'undergraduate' ? 999 : 1999;
    return pricePerPerson * teamSize;
  };

  const originalAmount = calculateAmount();
  const discountAmount = appliedCoupon ? (originalAmount * appliedCoupon.discount_percentage) / 100 : 0;
  const amount = originalAmount - discountAmount;

  // Don't auto-create payment order - let user apply coupon first
  // useEffect(() => {
  //   createPaymentOrder();
  // }, []);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      setCouponValidating(true);
      setCouponError(null);

      const response = await apiService.validateCoupon(couponCode.trim());
      
      if (response?.success) {
        setAppliedCoupon({
          code: response.data.code,
          discount_percentage: parseFloat(response.data.discount_percentage)
        });
        setCouponError(null);
      } else {
        setCouponError(response?.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error('Coupon validation failed:', err);
      setCouponError(err.message || 'Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    // Reset payment order so user can recreate with new coupon
    setPaymentOrder(null);
  };

  const createPaymentOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        competitionId,
        userType,
        teamSize,
        teamName: registrationType === 'team' ? teamName : undefined,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      };

      const response = await apiService.createPaymentOrder(paymentData);
      const orderData = response?.data || response;

      console.log('Payment order response:', response);
      console.log('Payment order data:', orderData);
      
      setPaymentOrder(orderData);

      // Track payment initiation
      if (orderData?.orderId) {
        trackPaymentInitiated(orderData.orderId, orderData.amount, 'INR', competitionId);
      }
      
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
      setPaymentStatus('processing');

      console.log('Payment order before redirect:', paymentOrder);
      console.log('Payment URL:', paymentOrder.paymentUrl);

      // Check if we have a payment URL from Getepay
      if (paymentOrder.paymentUrl) {
        console.log('Redirecting to payment URL:', paymentOrder.paymentUrl);
        // Redirect to Getepay payment page
        window.location.href = paymentOrder.paymentUrl;
      } else {
        // Fallback: simulate payment for testing
        console.log('No payment URL found, using simulation for testing');
        
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
      }

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
            {appliedCoupon && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">Original Amount:</span>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500 line-through">{originalAmount}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-green-600">Discount ({appliedCoupon.discount_percentage}%):</span>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">-{discountAmount.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-semibold">Total Amount:</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4 text-green-600" />
                <span className="font-bold text-lg text-gray-800">{amount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ₹{userType === 'undergraduate' ? '999':'1999'} per person
            </p>
          </div>
        </div>
      </div>

      {/* Coupon Code Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Have a Coupon Code?</h3>
        
        {!paymentOrder ? (
          !appliedCoupon ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={couponValidating}
                />
                <button
                  onClick={validateCoupon}
                  disabled={couponValidating || !couponCode.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {couponValidating ? 'Validating...' : 'Apply'}
                </button>
              </div>
              
              {couponError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-green-800 font-medium text-sm">
                      Coupon Applied: {appliedCoupon.code}
                    </p>
                    <p className="text-green-600 text-xs">
                      {appliedCoupon.discount_percentage}% discount
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium text-sm">
                    {appliedCoupon ? `Coupon Applied: ${appliedCoupon.code}` : 'No coupon applied'}
                  </p>
                  {appliedCoupon && (
                    <p className="text-green-600 text-xs">
                      {appliedCoupon.discount_percentage}% discount
                    </p>
                  )}
                </div>
              </div>
              {appliedCoupon && (
                <button
                  onClick={removeCoupon}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Change
                </button>
              )}
            </div>
          </div>
        )}
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
        {!paymentOrder ? (
          <CustomButton
            text={loading ? 'Creating Order...' : 'Continue to Payment'}
            onPressed={createPaymentOrder}
            enabled={!loading}
            loading={loading}
            variant="primary"
            size="md"
            fullWidth={true}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          />
        ) : (
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
        )}
        
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