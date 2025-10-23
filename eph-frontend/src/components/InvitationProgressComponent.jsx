// src/components/InvitationProgressComponent.jsx
import React, { useState } from 'react';
import CustomButton from './CustomButton';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Calendar,
  RefreshCw,
  Trash2,
  User
} from 'lucide-react';

const InvitationProgressComponent = ({ 
  invitations = [],
  showActions = false,
  onInvitationAction,
  className = ''
}) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (action, invitationId) => {
    if (!onInvitationAction) return;
    
    setActionLoading(prev => ({ ...prev, [`${invitationId}-${action}`]: true }));
    
    try {
      await onInvitationAction(action, invitationId);
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${invitationId}-${action}`]: false }));
    }
  };

  const getProgressPercentage = () => {
    if (invitations.length === 0) return 0;
    
    const resolvedCount = invitations.filter(inv => 
      inv.status === 'accepted' || inv.status === 'rejected' || inv.isExpired
    ).length;
    
    return Math.round((resolvedCount / invitations.length) * 100);
  };

  const getStatusIcon = (invitation) => {
    if (invitation.isExpired) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
    
    switch (invitation.status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (invitation) => {
    if (invitation.isExpired) return 'Expired';
    
    switch (invitation.status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Declined';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (invitation) => {
    if (invitation.isExpired) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    
    switch (invitation.status) {
      case 'accepted':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimeRemaining = (expiresAt) => {
    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      
      if (diffMs <= 0) return 'Expired';
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h remaining`;
      } else if (diffHours > 0) {
        return `${diffHours}h remaining`;
      } else {
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffMinutes}m remaining`;
      }
    } catch {
      return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  if (invitations.length === 0) {
    return (
      <div className={`bg-surface rounded-xl p-4 border border-border ${className}`}>
        <div className="text-center py-6">
          <Mail className="w-8 h-8 text-secondary-text mx-auto mb-2" />
          <p className="text-secondary-text">No invitations to display</p>
        </div>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const pendingCount = invitations.filter(inv => inv.status === 'pending' && !inv.isExpired).length;
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;
  const rejectedCount = invitations.filter(inv => inv.status === 'rejected').length;
  const expiredCount = invitations.filter(inv => inv.isExpired).length;

  return (
    <div className={`bg-surface rounded-xl p-4 border border-border ${className}`}>
      <div className="space-y-4">
        {/* Progress Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-primary-text font-semibold">Invitation Progress</h3>
          <span className="text-sm text-secondary-text">
            {invitations.length - pendingCount}/{invitations.length} resolved
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-background rounded-full h-2 border border-border">
            <div 
              className="bg-primary-text h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-secondary-text">
            <span>{progressPercentage}% complete</span>
            <span>{pendingCount} pending</span>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-background rounded-lg p-2 border border-border text-center">
            <div className="text-sm font-semibold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-secondary-text">Pending</div>
          </div>
          <div className="bg-background rounded-lg p-2 border border-border text-center">
            <div className="text-sm font-semibold text-green-600">{acceptedCount}</div>
            <div className="text-xs text-secondary-text">Accepted</div>
          </div>
          <div className="bg-background rounded-lg p-2 border border-border text-center">
            <div className="text-sm font-semibold text-red-600">{rejectedCount}</div>
            <div className="text-xs text-secondary-text">Declined</div>
          </div>
          <div className="bg-background rounded-lg p-2 border border-border text-center">
            <div className="text-sm font-semibold text-orange-600">{expiredCount}</div>
            <div className="text-xs text-secondary-text">Expired</div>
          </div>
        </div>

        {/* Invitation List */}
        <div className="space-y-2">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="bg-background rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getStatusIcon(invitation)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-primary-text font-medium truncate">
                        {invitation.inviteeName || invitation.email}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invitation)}`}>
                        {getStatusText(invitation)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-secondary-text mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Sent: {formatDate(invitation.sentAt)}</span>
                      </div>
                      
                      {invitation.status === 'pending' && !invitation.isExpired && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeRemaining(invitation.expiresAt)}</span>
                        </div>
                      )}
                      
                      {invitation.respondedAt && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Responded: {formatDate(invitation.respondedAt)}</span>
                        </div>
                      )}
                      
                      {invitation.isExpired && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Expired: {formatDate(invitation.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {showActions && (invitation.canResend || invitation.status === 'pending') && (
                  <div className="flex items-center gap-1 ml-2">
                    {invitation.canResend && (
                      <CustomButton
                        text={actionLoading[`${invitation.id}-resend`] ? '' : ''}
                        onPressed={() => handleAction('resend', invitation.id)}
                        loading={actionLoading[`${invitation.id}-resend`]}
                        variant="outline"
                        size="sm"
                        fullWidth={false}
                        className="p-1 min-w-0"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </CustomButton>
                    )}
                    
                    {invitation.status === 'pending' && (
                      <CustomButton
                        text={actionLoading[`${invitation.id}-cancel`] ? '' : ''}
                        onPressed={() => handleAction('cancel', invitation.id)}
                        loading={actionLoading[`${invitation.id}-cancel`]}
                        variant="outline"
                        size="sm"
                        fullWidth={false}
                        className="p-1 min-w-0 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </CustomButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Completion Status */}
        {progressPercentage === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">All Invitations Resolved</p>
                <p className="text-green-700 text-sm">
                  Team formation process is complete. {acceptedCount} member{acceptedCount !== 1 ? 's' : ''} joined your team.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationProgressComponent;