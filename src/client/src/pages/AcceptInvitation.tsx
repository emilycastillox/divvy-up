import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Users, Mail } from 'lucide-react';
import Button from '../components/UI/Button';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';

interface Invitation {
  id: string;
  groupId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
  inviter?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  group?: {
    id: string;
    name: string;
    description?: string;
  };
}

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { addNotification } = useApp();
  const { isAuthenticated, user } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getInvitation(token!);
      
      if (response.success && response.data?.invitation) {
        setInvitation(response.data.invitation);
      } else {
        setError(response.message || 'Invitation not found');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!isAuthenticated) {
      addNotification({ 
        type: 'warning', 
        message: 'Please log in to accept the invitation' 
      });
      navigate('/login', { state: { returnTo: `/invite/${token}` } });
      return;
    }

    try {
      setAccepting(true);
      const response = await apiClient.acceptInvitation(token!);
      
      if (response.success) {
        addNotification({ 
          type: 'success', 
          message: 'Successfully joined the group!' 
        });
        navigate('/dashboard');
      } else {
        addNotification({ 
          type: 'error', 
          message: response.message || 'Failed to accept invitation' 
        });
      }
    } catch (error: any) {
      addNotification({ 
        type: 'error', 
        message: error.message || 'Failed to accept invitation' 
      });
    } finally {
      setAccepting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = invitation ? new Date(invitation.expiresAt) < new Date() : false;
  const isUsed = invitation?.isUsed || false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">
            {error || 'This invitation link is invalid or has expired.'}
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Group Invitation</h1>
          <p className="text-blue-100">
            You've been invited to join a group
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isUsed ? (
            // Already Used
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invitation Already Used
              </h2>
              <p className="text-gray-600 mb-6">
                This invitation has already been accepted.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          ) : isExpired ? (
            // Expired
            <div className="text-center">
              <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invitation Expired
              </h2>
              <p className="text-gray-600 mb-6">
                This invitation has expired. Please ask for a new invitation.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            // Valid Invitation
            <div className="space-y-6">
              {/* Group Info */}
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {invitation.group?.name}
                </h2>
                {invitation.group?.description && (
                  <p className="text-gray-600 mb-4">
                    {invitation.group.description}
                  </p>
                )}
              </div>

              {/* Inviter Info */}
              {invitation.inviter && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {invitation.inviter.avatarUrl ? (
                        <img
                          src={invitation.inviter.avatarUrl}
                          alt={`${invitation.inviter.firstName} ${invitation.inviter.lastName}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-sm">
                          {invitation.inviter.firstName.charAt(0)}{invitation.inviter.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invitation.inviter.firstName} {invitation.inviter.lastName}
                      </p>
                      <p className="text-xs text-gray-500">invited you as {invitation.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Verification */}
              {user && user.email !== invitation.email && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Email Mismatch
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This invitation was sent to <strong>{invitation.email}</strong>, 
                        but you're logged in as <strong>{user.email}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expiration Info */}
              <div className="text-center text-sm text-gray-500">
                <p>Invitation expires on {formatDate(invitation.expiresAt)}</p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {isAuthenticated ? (
                  <Button
                    variant="primary"
                    onClick={handleAcceptInvitation}
                    loading={accepting}
                    disabled={accepting}
                    className="w-full"
                  >
                    {accepting ? 'Joining Group...' : 'Accept Invitation'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => navigate('/login', { state: { returnTo: `/invite/${token}` } })}
                    className="w-full"
                  >
                    Log In to Accept
                  </Button>
                )}
                
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
