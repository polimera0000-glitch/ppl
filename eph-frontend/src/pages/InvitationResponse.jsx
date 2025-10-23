// src/pages/InvitationResponse.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import CustomButton from '../components/CustomButton';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

const InvitationResponse = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const action = searchParams.get('action'); // 'accept' or 'reject'
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get invitation details by token
      const response = await apiService.getInvitationByToken(token);
      const invitationData = response?.data || response;
      
      console.log('Invitation API response:', response);
      console.log('Invitation data:', invitationData);
      
      setInvitation(invitationData);
      
      // If action is specified in URL, auto-process it
      if (action && (action === 'accept' || action === 'reject')) {
        await handleResponse(action);
      }
      
    } catch (err) {
      console.error('Failed to fetch invitation details:', err);
      setError(err.message || 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (responseAction) => {
    if (!invitation || processing) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      // Send response to backend
      const response = await apiService.respondToInvitation(token, responseAction);
      
      setSuccess(true);
      setMessage(response?.message || `Invitation ${responseAction}ed successfully!`);
      
    } catch (err) {
      console.error(`Failed to ${responseAction} invitation:`, err);
      setError(err.message || `Failed to ${responseAction} invitation`);
    } finally {
      setProcessing(false);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'accept':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'reject':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Users className="w-8 h-8 text-blue-500" />;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'accept':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'reject':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Invitation</h2>
          <p className="text-gray-600">Please wait while we load your invitation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <CustomButton
            text="Go to Homepage"
            onPressed={() => navigate('/')}
            variant="primary"
            size="md"
            fullWidth={true}
          />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          {getActionIcon(action)}
          <h2 className="text-xl font-semibold text-gray-800 mb-2 mt-4">
            {action === 'accept' ? 'Invitation Accepted!' : 'Invitation Declined'}
          </h2>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="space-y-3">
            <CustomButton
              text="View Competitions"
              onPressed={() => navigate('/competitions')}
              variant="primary"
              size="md"
              fullWidth={true}
            />
            <CustomButton
              text="Go to Homepage"
              onPressed={() => navigate('/')}
              variant="outline"
              size="md"
              fullWidth={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Team Invitation</h1>
          <p className="text-gray-600">You've been invited to join a team!</p>
        </div>

        {/* Invitation Details */}
        {invitation && (
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Invitation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Team:</span>
                  <span className="font-medium">{invitation.team?.name || 'Team Name'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Leader:</span>
                  <span className="font-medium">{invitation.team?.leader?.name || 'Team Leader'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Competition:</span>
                  <span className="font-medium">{invitation.competition?.title || 'Competition'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(invitation.invitation?.status)}`}>
                    {invitation.invitation?.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {invitation.competition?.description && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">About the Competition</h4>
                <p className="text-blue-700 text-sm">{invitation.competition.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!action && invitation?.invitation?.status === 'pending' && !invitation?.invitation?.is_expired && (
          <div className="space-y-3">
            <CustomButton
              text={processing ? 'Processing...' : '✅ Accept Invitation'}
              onPressed={() => handleResponse('accept')}
              enabled={!processing}
              loading={processing}
              variant="primary"
              size="md"
              fullWidth={true}
            />
            <CustomButton
              text={processing ? 'Processing...' : '❌ Decline Invitation'}
              onPressed={() => handleResponse('reject')}
              enabled={!processing}
              loading={processing}
              variant="outline"
              size="md"
              fullWidth={true}
              className="text-red-600 border-red-200 hover:bg-red-50"
            />
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <CustomButton
            text="Back to Homepage"
            onPressed={() => navigate('/')}
            variant="outline"
            size="sm"
            fullWidth={true}
          />
        </div>
      </div>
    </div>
  );
};

export default InvitationResponse;