import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Lock, User, X, Eye, EyeOff, Loader2, Info } from 'lucide-react';

import { toast } from 'sonner';
import { useGetStudentProfile } from '../../store/tanstackStore/services/queries';
import { useMutation } from '@tanstack/react-query';
import { updateStudentProfileService, changeStudentPasswordService } from '../../store/tanstackStore/services/api';

const APP_INFO = __APP_VERSION__;

const formatBuildDate = (iso) => {
  if (!iso) return 'Not available';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const SettingSection = ({ icon, title, children }) => {
  const Icon = icon;
  return (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Icon className="w-5 h-5 text-primary-500" />
      </div>
      <h2 className="text-lg font-medium text-semantic-text-primary">{title}</h2>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const Settings = () => {

  const { data: userData, isLoading } = useGetStudentProfile();

  const [previousBuild] = useState(() => localStorage.getItem('umi_prev_app_version'));

  const [userDetails, setUserDetails] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    registrationNumber: '',
    course: '',
    academicYear: ''
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editedUserDetails, setEditedUserDetails] = useState({ ...userDetails });
  const [passwordDetails, setPasswordDetails] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: updateStudentProfileService,
    onSuccess: () => {
      setUserDetails(editedUserDetails);
      setEditModalOpen(false);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message);
      console.error('Error updating profile:', error);
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: changeStudentPasswordService,
    onSuccess: () => {
      setPasswordModalOpen(false);
      setPasswordDetails({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message);
      console.error('Error updating password:', error);
    }
  });

  useEffect(() => {
    if (userData) {

      const details = {
        fullName: userData?.student?.fullName || '',
        email: userData?.student?.email || '',
        phoneNumber: userData?.student?.phoneNumber || '',
        registrationNumber: userData?.student?.registrationNumber || '',
        course: userData?.student?.course?.title || userData?.student?.course || '',
        specialization: userData?.student?.specialization?.name || userData?.student?.specialization || '',
        academicYear: userData?.student?.academicYear || ''
      };
      setUserDetails(details);
      setEditedUserDetails(details);
    }
  }, [userData]);

  console.log("trace", userData);
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatePayload = { ...editedUserDetails };
      delete updatePayload.course;
      delete updatePayload.specialization;
      delete updatePayload.registrationNumber;
      delete updatePayload.email;
      await updateProfileMutation.mutateAsync(updatePayload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordDetails.newPassword !== passwordDetails.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordDetails.currentPassword,
        newPassword: passwordDetails.newPassword
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences"
      />

      <div className="grid gap-6">
        {/* Profile Settings */}
        <SettingSection icon={User} title="Profile Settings">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-semantic-text-primary">Personal Information</h3>
                <button
                  className="px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-md hover:bg-blue-50"
                  onClick={() => {
                    setEditedUserDetails({ ...userDetails });
                    setEditModalOpen(true);
                  }}
                >
                  Edit
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Full Name</p>
                    <p className="text-sm font-medium">{userDetails.fullName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Email</p>
                    <p className="text-sm font-medium">{userDetails.email || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Phone</p>
                    <p className="text-sm font-medium">{userDetails.phoneNumber || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Registration Number</p>
                    <p className="text-sm font-medium">{userDetails.registrationNumber || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Course</p>
                    <p className="text-sm font-medium">{userDetails.course || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Specialization</p>
                    <p className="text-sm font-medium">{userDetails.specialization || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-semantic-text-secondary">Academic Year</p>
                    <p className="text-sm font-medium">{userDetails.academicYear || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>

        {/* Security Settings */}
        <SettingSection icon={Lock} title="Security Settings">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-semantic-text-primary">Password</h3>
              <p className="text-sm text-semantic-text-secondary">Change your password</p>
            </div>
            <button
              className="px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-md hover:bg-blue-50"
              onClick={() => setPasswordModalOpen(true)}
            >
              Update
            </button>
          </div>

        </SettingSection>

        {/* About / App version */}
        <SettingSection icon={Info} title="About">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-semantic-text-secondary">App version</p>
              <p className="text-sm font-medium">{APP_INFO?.version && APP_INFO.version !== '0.0.0' ? `v${APP_INFO.version}` : 'UMI Student Portal'}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-semantic-text-secondary">Build date</p>
              <p className="text-sm font-medium">{formatBuildDate(APP_INFO?.build)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-semantic-text-secondary">Previous build</p>
              <p className="text-sm font-medium">
                {previousBuild && previousBuild !== APP_INFO?.build ? formatBuildDate(previousBuild) : 'First install'}
              </p>
            </div>
          </div>
        </SettingSection>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile Information"


      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              id="fullName"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none"
              value={editedUserDetails.fullName}
              onChange={(e) => setEditedUserDetails({ ...editedUserDetails, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              id="phoneNumber"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none"
              value={editedUserDetails.phoneNumber}
              onChange={(e) => setEditedUserDetails({ ...editedUserDetails, phoneNumber: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <input
              type="text"
              id="course"
              className="w-full p-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-md focus:outline-none cursor-not-allowed"
              value={editedUserDetails.course}
              disabled
            />
          </div>

          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <input
              type="text"
              id="specialization"
              className="w-full p-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-md focus:outline-none cursor-not-allowed"
              value={editedUserDetails.specialization}
              disabled
            />
          </div>

          <div>
            <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <input
              type="text"
              id="academicYear"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none"
              value={editedUserDetails.academicYear}
              onChange={(e) => setEditedUserDetails({ ...editedUserDetails, academicYear: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none pr-10"
                value={passwordDetails.currentPassword}
                onChange={(e) => setPasswordDetails({ ...passwordDetails, currentPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none pr-10"
                value={passwordDetails.newPassword}
                onChange={(e) => setPasswordDetails({ ...passwordDetails, newPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:outline-none pr-10"
                value={passwordDetails.confirmPassword}
                onChange={(e) => setPasswordDetails({ ...passwordDetails, confirmPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordDetails.newPassword !== passwordDetails.confirmPassword &&
              passwordDetails.confirmPassword &&
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            }
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 flex items-center justify-center gap-2"
              disabled={isSubmitting || (passwordDetails.newPassword !== passwordDetails.confirmPassword && passwordDetails.confirmPassword)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;