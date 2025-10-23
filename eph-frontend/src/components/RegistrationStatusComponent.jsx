// src/components/RegistrationStatusComponent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import CustomButton from './CustomButton';
import TeamDetailsPanel from './TeamDetailsPanel';
import InvitationProgressComponent from './InvitationProgressComponent';
import {
  CheckCircle,
  Clock,
  Users,
  User,
  Calendar,
  AlertCircle,
  Settings,
  Eye,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const RegistrationStatusComponent = ({ 
  competitionId, 
  onStatusChange,
  className = '' 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  useEffect(() => {
    if (!competitionId || !user) return;
    
    const fetchRegistrationStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getCompetitionRegistrationStatus(competitionId);
        const data = response?.data || response;
        
        console.log('Registration status response:', response);
        console.log('Registration data:', data);
        console.log('Is registered:', data?.isRegistered);
        console.log('Registration type:', data?.registration?.type);
        console.log('Team data:', data?.team);
        console.log('Invitations:', data?.invitations);
        console.log('Invitation summary:', data?.invitationSummary);
        
        setRegistrationData(data);
        
        // Notify parent component of status change
        if (onStatusChange) {
          onStatusChange({
            isRegistered: data.isRegistered,
            registrationType: data.registration?.type || null,
            status: data.registration?.status || null
          });
        }
        
      } catch (err) {
        console.error('Failed to fetch registration status:', err);
        setError(err.message || 'Failed to load registration status');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrationStatus();
  }, [competitionId, user, onStatusChange]);

  const handleRegister = () => {
    navigate('/competition/register', {
      state: { competitionId, fromDetails: true }
    });
  };

  const handleViewDetails = () => {
    console.log('View Details clicked', registrationData);
    // For now, show registration details in a modal or navigate to a details page
    // Since we don't have a dedicated registration details page, let's show an alert with the info
    if (registrationData?.registration) {
      const reg = registrationData.registration;
      alert(`Registration Details:
ID: ${reg.id}
Type: ${reg.type}
Status: ${reg.status}
${reg.teamName ? `Team: ${reg.teamName}` : ''}
Registered: ${new Date(reg.registeredAt).toLocaleDateString()}`);
    } else {
      alert('No registration data available');
    }
  };

  const handleManageTeam = () => {
    console.log('Manage Team clicked', registrationData);
    // For now, show team management info
    // In a real implementation, this would navigate to a team management page
    if (registrationData?.team) {
      alert(`Team Management:
Team: ${registrationData.team.name}
Leader: ${registrationData.team.leader?.name}
Size: ${registrationData.team.currentSize}/${registrationData.team.maxSize}

This would normally open a team management interface.`);
    } else {
      alert('No team data available or not a team registration');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className={`bg-surface rounded-xl p-4 border border-border ${className}`}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-text"></div>
          <span className="text-secondary-text">Loading registration status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-surface rounded-xl p-4 border border-border ${className}`}>
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!registrationData) {
    console.log('No registration data available');
    return null;
  }

  console.log('Rendering with registration data:', registrationData);

  // Not registered state
  if (!registrationData.isRegistered) {
    return (
      <div className={`bg-surface rounded-xl p-4 border border-border ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
              <User className="w-5 h-5 text-secondary-text" />
            </div>
            <div>
              <h3 className="text-primary-text font-semibold">Not Registered</h3>
              <p className="text-secondary-text text-sm">
                You haven't registered for this competition yet
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {registrationData.permissions?.canRegisterIndividual && (
              <CustomButton
                text="Register as Individual"
                onPressed={() => {
                  console.log('Register as Individual clicked');
                  navigate('/competition/register', {
                    state: { 
                      competitionId, 
                      fromDetails: true,
                      registrationType: 'individual'
                    }
                  });
                }}
                enabled={true}
                variant="primary"
                size="sm"
                fullWidth={false}
              />
            )}
            {registrationData.permissions?.canRegisterTeam && (
              <CustomButton
                text="Register as Team"
                onPressed={() => {
                  console.log('Register as Team clicked');
                  navigate('/competition/register', {
                    state: { 
                      competitionId, 
                      fromDetails: true,
                      registrationType: 'team'
                    }
                  });
                }}
                enabled={true}
                variant="outline"
                size="sm"
                fullWidth={false}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Registered state
  const { registration, team, permissions } = registrationData;
  const isTeamRegistration = registration.type === 'team';

  return (
    <div className={`bg-surface rounded-xl p-4 border border-border ${className}`}>
      <div className="space-y-4">
        {/* Registration Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
              {isTeamRegistration ? (
                <Users className="w-5 h-5 text-primary-text" />
              ) : (
                <User className="w-5 h-5 text-primary-text" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-primary-text font-semibold">
                  {isTeamRegistration ? `Team: ${registration.teamName}` : 'Individual Registration'}
                </h3>
                {getStatusIcon(registration.status)}
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary-text">
                <Calendar className="w-4 h-4" />
                <span>Registered on {formatDate(registration.registeredAt)}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(registration.status)}`}>
            {getStatusText(registration.status)}
          </div>
        </div>

        {/* Team Information */}
        {isTeamRegistration && team && (
          <div className="space-y-3">
            {/* Team Summary */}
            <div className="bg-background rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-primary-text font-medium">Team Information</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary-text">
                    {team.currentSize}/{team.maxSize} members
                  </span>
                  <CustomButton
                    text={showTeamDetails ? 'Hide Details' : 'Show Details'}
                    onPressed={() => setShowTeamDetails(!showTeamDetails)}
                    enabled={true}
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    className="text-xs"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-secondary-text">Leader:</span>
                  <span className="text-primary-text">{team.leader?.name}</span>
                </div>
                
                {registration.invitationStatus === 'pending_invitations' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600">Waiting for team member responses</span>
                  </div>
                )}
                
                {registration.invitationStatus === 'complete' && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Team formation complete</span>
                  </div>
                )}

                {/* Quick invitation summary */}
                {registrationData.invitationSummary && registrationData.invitationSummary.total > 0 ? (
                  <div className="flex items-center gap-4 text-xs text-secondary-text">
                    <span className="text-yellow-600">Pending: {registrationData.invitationSummary.pending || 0}</span>
                    <span className="text-green-600">Accepted: {registrationData.invitationSummary.accepted || 0}</span>
                    <span className="text-red-600">Declined: {registrationData.invitationSummary.rejected || 0}</span>
                    {registrationData.invitationSummary.expired > 0 && (
                      <span className="text-orange-600">Expired: {registrationData.invitationSummary.expired}</span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-secondary-text">
                    No team members invited yet. {permissions?.canManageTeam && 'Click "Show Details" to invite members.'}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Team Information */}
            {showTeamDetails && (
              <div className="space-y-3">
                {/* Team Details Panel */}
                {registrationData.team ? (
                  <TeamDetailsPanel
                    registrationId={registration.id}
                    teamData={registrationData.team}
                    invitations={registrationData.invitations || []}
                    invitationSummary={registrationData.invitationSummary || {}}
                    isTeamLeader={permissions?.canManageTeam || false}
                    onTeamUpdate={() => {
                      // Refresh registration data
                      window.location.reload(); // Simple refresh for now
                    }}
                    onInvitationAction={async (action, invitationId) => {
                      console.log(`${action} invitation ${invitationId}`);
                      try {
                        if (action === 'resend') {
                          await apiService.resendInvitation(invitationId);
                          alert('Invitation resent successfully!');
                          // Refresh the registration data
                          window.location.reload();
                        } else if (action === 'cancel') {
                          const confirmed = window.confirm('Are you sure you want to cancel this invitation?');
                          if (confirmed) {
                            await apiService.cancelInvitation(invitationId);
                            alert('Invitation cancelled successfully!');
                            // Refresh the registration data
                            window.location.reload();
                          }
                        }
                      } catch (error) {
                        console.error(`Failed to ${action} invitation:`, error);
                        alert(`Failed to ${action} invitation: ${error.message}`);
                      }
                    }}
                  />
                ) : (
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <h4 className="text-primary-text font-medium mb-2">Team Details</h4>
                    <p className="text-secondary-text text-sm mb-3">
                      Team information is not available. This might be because:
                    </p>
                    <ul className="text-secondary-text text-sm space-y-1 ml-4">
                      <li>• Team data is still loading</li>
                      <li>• No team members have been invited yet</li>
                      <li>• There's an issue with the team data</li>
                    </ul>
                    {permissions?.canManageTeam && (
                      <div className="mt-3">
                        <CustomButton
                          text="Add Team Members"
                          onPressed={() => {
                            const emails = prompt('Enter email addresses separated by commas:\n\nExample: john@example.com, jane@example.com');
                            if (emails && emails.trim()) {
                              const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
                              
                              // Basic email validation
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              const invalidEmails = emailList.filter(email => !emailRegex.test(email));
                              
                              if (invalidEmails.length > 0) {
                                alert(`Invalid email addresses: ${invalidEmails.join(', ')}`);
                                return;
                              }
                              
                              if (emailList.length > 0) {
                                apiService.sendInvitations(registration.id, emailList)
                                  .then(() => {
                                    alert(`Invitations sent successfully to ${emailList.length} email(s)!`);
                                    window.location.reload();
                                  })
                                  .catch(error => {
                                    console.error('Failed to send invitations:', error);
                                    alert(`Failed to send invitations: ${error.message}`);
                                  });
                              } else {
                                alert('Please enter at least one email address.');
                              }
                            }
                          }}
                          enabled={true}
                          variant="primary"
                          size="sm"
                          fullWidth={false}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Invitation Progress */}
                {registrationData.invitations && registrationData.invitations.length > 0 ? (
                  <InvitationProgressComponent
                    invitations={registrationData.invitations}
                    showActions={permissions?.canManageTeam || false}
                    onInvitationAction={async (action, invitationId) => {
                      console.log(`${action} invitation ${invitationId}`);
                      try {
                        if (action === 'resend') {
                          await apiService.resendInvitation(invitationId);
                          alert('Invitation resent successfully!');
                          // Refresh the registration data
                          window.location.reload();
                        } else if (action === 'cancel') {
                          const confirmed = window.confirm('Are you sure you want to cancel this invitation?');
                          if (confirmed) {
                            await apiService.cancelInvitation(invitationId);
                            alert('Invitation cancelled successfully!');
                            // Refresh the registration data
                            window.location.reload();
                          }
                        }
                      } catch (error) {
                        console.error(`Failed to ${action} invitation:`, error);
                        alert(`Failed to ${action} invitation: ${error.message}`);
                      }
                    }}
                  />
                ) : (
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <h4 className="text-primary-text font-medium mb-2">Team Invitations</h4>
                    <p className="text-secondary-text text-sm mb-3">
                      No team invitations have been sent yet.
                    </p>
                    {permissions?.canManageTeam && (
                      <CustomButton
                        text="Invite Team Members"
                        onPressed={() => {
                          const emails = prompt('Enter email addresses separated by commas:\n\nExample: john@example.com, jane@example.com');
                          if (emails && emails.trim()) {
                            const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
                            
                            // Basic email validation
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            const invalidEmails = emailList.filter(email => !emailRegex.test(email));
                            
                            if (invalidEmails.length > 0) {
                              alert(`Invalid email addresses: ${invalidEmails.join(', ')}`);
                              return;
                            }
                            
                            if (emailList.length > 0) {
                              apiService.sendInvitations(registration.id, emailList)
                                .then(() => {
                                  alert(`Invitations sent successfully to ${emailList.length} email(s)!`);
                                  window.location.reload();
                                })
                                .catch(error => {
                                  console.error('Failed to send invitations:', error);
                                  alert(`Failed to send invitations: ${error.message}`);
                                });
                            } else {
                              alert('Please enter at least one email address.');
                            }
                          }
                        }}
                        enabled={true}
                        variant="primary"
                        size="sm"
                        fullWidth={false}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <CustomButton
            text="View Details"
            onPressed={handleViewDetails}
            enabled={true}
            variant="outline"
            size="sm"
            fullWidth={false}
          />
          
          {permissions?.canManageTeam && !showTeamDetails && (
            <CustomButton
              text="Manage Team"
              onPressed={() => setShowTeamDetails(true)}
              enabled={true}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          )}
          
          {permissions?.canWithdraw && (
            <CustomButton
              text="Withdraw"
              onPressed={() => {
                console.log('Withdraw clicked');
                const confirmed = window.confirm(
                  'Are you sure you want to withdraw from this competition? This action cannot be undone.'
                );
                if (confirmed) {
                  // TODO: Implement actual withdrawal API call
                  alert('Withdrawal functionality will be implemented in the next phase. This would call the withdrawal API.');
                }
              }}
              enabled={true}
              variant="outline"
              size="sm"
              fullWidth={false}
              className="text-red-600 border-red-200 hover:bg-red-50"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationStatusComponent;