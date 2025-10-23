// src/components/TeamDetailsPanel.jsx
import React, { useState } from 'react';
import CustomButton from './CustomButton';
import {
  Users,
  Crown,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  Calendar
} from 'lucide-react';

const TeamDetailsPanel = ({ 
  registrationId,
  teamData,
  invitations = [],
  invitationSummary = {},
  isTeamLeader = false,
  onTeamUpdate,
  onInvitationAction,
  className = ''
}) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleInvitationAction = async (action, invitationId) => {
    if (!onInvitationAction) return;
    
    setActionLoading(prev => ({ ...prev, [invitationId]: action }));
    
    try {
      await onInvitationAction(action, invitationId);
      if (onTeamUpdate) onTeamUpdate();
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  const getInvitationStatusIcon = (status, isExpired = false) => {
    if (isExpired) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
    
    switch (status) {
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

  const getInvitationStatusText = (status, isExpired = false) => {
    if (isExpired) return 'Expired';
    
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getInvitationStatusColor = (status, isExpired = false) => {
    if (isExpired) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    
    switch (status) {
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  const formatDateShort = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  if (!teamData) {
    return null;
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !inv.isExpired);
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');
  const expiredInvitations = invitations.filter(inv => inv.isExpired);
  const rejectedInvitations = invitations.filter(inv => inv.status === 'rejected');

  return (
    <div className={`bg-surface rounded-xl p-4 border border-border ${className}`}>
      <div className="space-y-4">
        {/* Team Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-text" />
            </div>
            <div>
              <h3 className="text-primary-text font-semibold">{teamData.name}</h3>
              <p className="text-secondary-text text-sm">
                {teamData.currentSize}/{teamData.maxSize} members
              </p>
            </div>
          </div>
          
          {isTeamLeader && (
            <CustomButton
              text="Add Member"
              onPressed={() => {
                // TODO: Implement add member functionality
                console.log('Add member functionality to be implemented');
              }}
              variant="outline"
              size="sm"
              fullWidth={false}
            />
          )}
        </div>

        {/* Team Leader */}
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-primary-text font-medium">{teamData.leader?.name}</p>
              <p className="text-secondary-text text-sm">{teamData.leader?.email}</p>
            </div>
            <span className="ml-auto px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-200">
              Leader
            </span>
          </div>
        </div>

        {/* Invitation Summary */}
        {invitationSummary.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-semibold text-primary-text">{invitationSummary.pending || 0}</div>
              <div className="text-xs text-secondary-text">Pending</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-semibold text-green-600">{invitationSummary.accepted || 0}</div>
              <div className="text-xs text-secondary-text">Accepted</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-semibold text-red-600">{invitationSummary.rejected || 0}</div>
              <div className="text-xs text-secondary-text">Rejected</div>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-semibold text-orange-600">{invitationSummary.expired || 0}</div>
              <div className="text-xs text-secondary-text">Expired</div>
            </div>
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div>
            <h4 className="text-primary-text font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending Invitations ({pendingInvitations.length})
            </h4>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-secondary-text" />
                      <div>
                        <p className="text-primary-text font-medium">
                          {invitation.inviteeName || invitation.email}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-secondary-text">
                          <span>Sent: {formatDateShort(invitation.sentAt)}</span>
                          <span>Expires: {formatDateShort(invitation.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInvitationStatusColor(invitation.status, invitation.isExpired)}`}>
                        {getInvitationStatusText(invitation.status, invitation.isExpired)}
                      </span>
                      
                      {isTeamLeader && invitation.canResend && (
                        <CustomButton
                          text={actionLoading[invitation.id] === 'resend' ? 'Sending...' : 'Resend'}
                          onPressed={() => handleInvitationAction('resend', invitation.id)}
                          loading={actionLoading[invitation.id] === 'resend'}
                          variant="outline"
                          size="sm"
                          fullWidth={false}
                          className="text-xs"
                        />
                      )}
                      
                      {isTeamLeader && (
                        <CustomButton
                          text={actionLoading[invitation.id] === 'cancel' ? 'Cancelling...' : 'Cancel'}
                          onPressed={() => handleInvitationAction('cancel', invitation.id)}
                          loading={actionLoading[invitation.id] === 'cancel'}
                          variant="outline"
                          size="sm"
                          fullWidth={false}
                          className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Members */}
        {acceptedInvitations.length > 0 && (
          <div>
            <h4 className="text-primary-text font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Team Members ({acceptedInvitations.length})
            </h4>
            <div className="space-y-2">
              {acceptedInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-primary-text font-medium">
                          {invitation.inviteeName || invitation.email}
                        </p>
                        <p className="text-xs text-secondary-text">
                          Joined on {formatDateShort(invitation.respondedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                      Member
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expired Invitations */}
        {expiredInvitations.length > 0 && (
          <div>
            <h4 className="text-primary-text font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Expired Invitations ({expiredInvitations.length})
            </h4>
            <div className="space-y-2">
              {expiredInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-background rounded-lg p-3 border border-border opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-primary-text font-medium">
                          {invitation.inviteeName || invitation.email}
                        </p>
                        <p className="text-xs text-secondary-text">
                          Expired on {formatDateShort(invitation.expiresAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full border border-orange-200">
                        Expired
                      </span>
                      
                      {isTeamLeader && (
                        <CustomButton
                          text={actionLoading[invitation.id] === 'resend' ? 'Sending...' : 'Resend'}
                          onPressed={() => handleInvitationAction('resend', invitation.id)}
                          loading={actionLoading[invitation.id] === 'resend'}
                          variant="outline"
                          size="sm"
                          fullWidth={false}
                          className="text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Invitations */}
        {rejectedInvitations.length > 0 && (
          <div>
            <h4 className="text-primary-text font-medium mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Declined Invitations ({rejectedInvitations.length})
            </h4>
            <div className="space-y-2">
              {rejectedInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-background rounded-lg p-3 border border-border opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-primary-text font-medium">
                          {invitation.inviteeName || invitation.email}
                        </p>
                        <p className="text-xs text-secondary-text">
                          Declined on {formatDateShort(invitation.respondedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full border border-red-200">
                      Declined
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Completion Status */}
        {invitationSummary.isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Team Formation Complete</p>
                <p className="text-green-700 text-sm">
                  All team invitations have been resolved. Your team is ready to compete!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetailsPanel;