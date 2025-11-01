// src/pages/PaymentPending.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import SidebarLayout from '../components/SidebarLayout';
import CustomButton from '../components/CustomButton';
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const PaymentPending = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showManualCheck, setShowManualCheck] = useState(false);

  // Get payment URL from navigation state
  const { paymentUrl, amount, competition } = location.state || {};

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!orderId) {
      navigate('/competitions');
      return;
    }

    // Start polling for payment status
    checkPaymentStatus();
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000); // Check every 5 seconds

    // Stop polling after 2 minutes and show manual check option
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setShowManualCheck(true);
      setLoading(false);
    }, 120000); // 2 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [orderId, user]);

  const checkPaymentStatus = async () => {
    try {
      setPollingCount(prev => prev + 1);
      const response = await apiService.getPaymentStatus(orderId);
      
      if (response?.success) {
        setPaymentData(response.data);
        
        if (response.data.status === 'completed') {
          // Payment successful - redirect to success page
          navigate(`/payment/success/${orderId}`, {
            state: { paymentResult: response.data, competition }
          });
          return;
        } else if (response.data.status === 'failed') {
          // Payment failed - redirect to failure page
          navigate(`/competitions?payment=failed&orderId=${orderId}`);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleManualRefresh = () => {
    setLoading(true);
    setShowManualCheck(false);
    setPollingCount(0);
    checkPaymentStatus();
    
    // Resume polling for another minute
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      setShowManualCheck(true);
      setLoading(false);
    }, 60000);
  };

  const handleGoToPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  const handleContactSupport = () => {
    // You can implement this to open a support chat or email
    alert('Please contact support with your Order ID: ' + orderId);
  };

  if (loading && pollingCount === 0) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Loading Payment Details</h2>
              <p className="text-gray-600">Please wait...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Pending Header */}
            <div className="text-center mb-6">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Pending</h1>
              <p className="text-gray-600">
                We're waiting for confirmation of your payment
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Order ID:</span>
                  <span className="font-medium text-yellow-800">{orderId}</span>
                </div>
                {amount && (
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Amount:</span>
                    <span className="font-medium text-yellow-800">₹{amount}</span>
                  </div>
                )}
                {competition && (
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Competition:</span>
                    <span className="font-medium text-yellow-800">{competition.title}</span>
                  </div>
                )}
                {paymentData && (
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Status:</span>
                    <span className="font-medium text-yellow-800 capitalize">{paymentData.status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Checking Payment Status</h3>
                    <p className="text-sm text-blue-700">
                      Attempt {pollingCount} - We'll keep checking for updates...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {showManualCheck && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">Payment Status Unclear</h3>
                    <p className="text-sm text-orange-700 mb-3">
                      We haven't received confirmation yet. This could mean:
                    </p>
                    <ul className="text-sm text-orange-700 space-y-1 mb-3">
                      <li>• Payment is still processing</li>
                      <li>• Payment was completed but confirmation is delayed</li>
                      <li>• Payment was not completed</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {paymentUrl && (
                <CustomButton
                  text="Complete Payment"
                  onPressed={handleGoToPayment}
                  variant="primary"
                  size="md"
                  fullWidth={true}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  icon={<ExternalLink className="w-4 h-4" />}
                />
              )}

              <CustomButton
                text="Refresh Status"
                onPressed={handleManualRefresh}
                variant="outline"
                size="md"
                fullWidth={true}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                icon={<RefreshCw className="w-4 h-4" />}
              />

              <div className="grid grid-cols-2 gap-3">
                <CustomButton
                  text="Contact Support"
                  onPressed={handleContactSupport}
                  variant="outline"
                  size="sm"
                  fullWidth={true}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                />
                
                <CustomButton
                  text="Back to Competitions"
                  onPressed={() => navigate('/competitions')}
                  variant="outline"
                  size="sm"
                  fullWidth={true}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                />
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">What to do next?</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. If you haven't completed payment, click "Complete Payment"</p>
                <p>2. If you've paid, wait a few minutes and click "Refresh Status"</p>
                <p>3. If issues persist, contact support with your Order ID</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default PaymentPending;