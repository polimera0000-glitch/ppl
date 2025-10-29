// src/pages/PaymentScreen.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import SidebarLayout from '../components/SidebarLayout';
import PaymentComponent from '../components/PaymentComponent';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const PaymentScreen = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  // Get registration data from navigation state
  const registrationData = location.state || {};

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (orderId) {
      // If orderId is provided, get payment status
      fetchPaymentStatus();
    } else if (registrationData.competitionId) {
      // If registration data is provided, fetch competition details
      fetchCompetitionDetails();
    } else {
      setError('Invalid payment request');
      setLoading(false);
    }
  }, [orderId, user]);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPaymentStatus(orderId);
      const data = response?.data || response;
      
      setPaymentData(data);
      setCompetition(data.competition);
      
    } catch (err) {
      console.error('Failed to fetch payment status:', err);
      setError(err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitionDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCompetition(registrationData.competitionId);
      const data = response?.data?.competition || response?.competition || response;
      
      setCompetition(data);
      
    } catch (err) {
      console.error('Failed to fetch competition details:', err);
      setError(err.message || 'Failed to load competition details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentResult) => {
    // Navigate to success page or back to competition
    navigate(`/payment/success/${paymentResult.orderId}`, {
      state: { 
        paymentResult,
        competition,
        registrationData 
      }
    });
  };

  const handlePaymentCancel = () => {
    // Navigate back to registration or competition page
    if (registrationData.competitionId) {
      navigate(`/competition/${registrationData.competitionId}`);
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Loading Payment</h2>
              <p className="text-gray-600">Please wait...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/competitions')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Competitions
              </button>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="max-w-md mx-auto mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Payment Component */}
        <PaymentComponent
          competitionId={registrationData.competitionId || competition?.id}
          competitionTitle={competition?.title || 'Competition'}
          registrationData={registrationData}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      </div>
    </SidebarLayout>
  );
};

export default PaymentScreen;