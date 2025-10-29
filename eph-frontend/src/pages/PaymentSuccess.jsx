// src/pages/PaymentSuccess.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import SidebarLayout from '../components/SidebarLayout';
import CustomButton from '../components/CustomButton';
import {
  CheckCircle,
  Download,
  Mail,
  Calendar,
  Users,
  IndianRupee,
  ArrowRight
} from 'lucide-react';

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Get data from navigation state
  const { paymentResult, competition, registrationData } = location.state || {};

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (paymentResult) {
      setPaymentData(paymentResult);
      completeRegistration();
    } else if (orderId) {
      fetchPaymentDetails();
    } else {
      navigate('/competitions');
    }
  }, [orderId, user]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPaymentStatus(orderId);
      const data = response?.data || response;
      
      setPaymentData(data);
      
      if (data.status === 'completed') {
        // Check if registration is already complete
        // If not, complete it
        completeRegistration();
      }
      
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    if (!registrationData?.formData) {
      setRegistrationComplete(true);
      setLoading(false);
      return;
    }

    try {
      // Complete the registration now that payment is successful
      const response = await apiService.registerForCompetition(
        registrationData.competitionId, 
        registrationData.formData
      );

      if (response?.success) {
        setRegistrationComplete(true);
      }
      
    } catch (err) {
      console.error('Failed to complete registration:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download
    alert('Receipt download will be implemented');
  };

  const handleViewCompetition = () => {
    const competitionId = competition?.id || registrationData?.competitionId;
    if (competitionId) {
      navigate(`/competition/${competitionId}`);
    } else {
      navigate('/competitions');
    }
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Completing Registration</h2>
              <p className="text-gray-600">Please wait while we finalize your registration...</p>
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
            {/* Success Header */}
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {registrationComplete ? 'Registration Complete!' : 'Payment Successful!'}
              </h1>
              <p className="text-gray-600">
                {registrationComplete 
                  ? 'You have successfully registered for the competition'
                  : 'Your payment has been processed successfully'
                }
              </p>
            </div>

            {/* Payment Details */}
            {paymentData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Order ID:</span>
                    <span className="font-medium text-green-800">{paymentData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount Paid:</span>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-green-800">{paymentData.amount}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Status:</span>
                    <span className="font-medium text-green-800 capitalize">{paymentData.status}</span>
                  </div>
                  {paymentData.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Paid At:</span>
                      <span className="font-medium text-green-800">
                        {new Date(paymentData.paidAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Competition Details */}
            {competition && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-3">Competition Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Competition:</span>
                    <span className="font-medium text-blue-800">{competition.title}</span>
                  </div>
                  {registrationData?.registrationType === 'team' && registrationData?.teamName && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Team Name:</span>
                      <span className="font-medium text-blue-800">{registrationData.teamName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-blue-700">Type:</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span className="font-medium text-blue-800 capitalize">
                        {registrationData?.registrationType || 'Individual'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">What's Next?</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>You'll receive a confirmation email shortly</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Check competition timeline and important dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Join the competition community for updates</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <CustomButton
                text="View Competition"
                onPressed={handleViewCompetition}
                variant="primary"
                size="md"
                fullWidth={true}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <CustomButton
                  text="Download Receipt"
                  onPressed={handleDownloadReceipt}
                  variant="outline"
                  size="sm"
                  fullWidth={true}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                />
                
                <CustomButton
                  text="All Competitions"
                  onPressed={() => navigate('/competitions')}
                  variant="outline"
                  size="sm"
                  fullWidth={true}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default PaymentSuccess;