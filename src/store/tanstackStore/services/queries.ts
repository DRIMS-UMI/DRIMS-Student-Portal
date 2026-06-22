import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../utils/tanstack';
import { 
  loginStudentService, 
  getLoggedInUserService,
  getStudentProfileService, 
  updateStudentProfileService, 
  changeStudentPasswordService, 
  getStudentDashboardStatsService, 
  getStudentNotificationsService, 
  markStudentNotificationAsReadService, 
  logoutStudentService,
  getStudentStatusesService,
  getStudentProposalsService,
  getStudentBooksService,
  getStudentResearchRequestsService,
  createStudentResearchRequestService,
  getUnreadMessageCountService,
  getAvailableEvaluationsService,
  submitStudentEvaluationService,
  getStudentEvaluationsService,
  getStudentDocumentsService,
  getAvailableResearchClinicDaysService,
  bookResearchClinicSessionService,
  getStudentResearchClinicBookingsService,
  cancelResearchClinicBookingService,
  getAvailableAppointmentsService,
  bookAppointmentService,
  getStudentAppointmentsService
} from './api';

/* ********** STUDENT QUERIES ********** */

export const useGetLoggedInUser = () => {
  return useQuery({
    queryKey: ['loggedInUser'],
    queryFn: getLoggedInUserService,
    staleTime: Infinity,
    refetchInterval: false,
  });
};

export const useGetStudentProfile = () => {
  return useQuery({
    queryKey: ['studentProfile'],
    queryFn: getStudentProfileService,
    staleTime: Infinity,
    refetchInterval: false,
  });
};

export const useGetStudentDashboardStats = () => {
  return useQuery({
    queryKey: ['studentDashboardStats'],
    queryFn: getStudentDashboardStatsService,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetStudentNotifications = () => {
  return useQuery({
    queryKey: ['studentNotifications'],
    queryFn: getStudentNotificationsService,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/* ********** STUDENT STATUS, PROPOSAL, AND BOOK QUERIES ********** */

export const useGetStudentStatuses = (studentId: string) => {
  return useQuery({
    queryKey: ['studentStatuses', studentId],
    queryFn: () => getStudentStatusesService(studentId),
    enabled: !!studentId,
  });
};

export const useGetStudentProposals = (studentId: string) => {
  return useQuery({
    queryKey: ['studentProposals', studentId],
    queryFn: () => getStudentProposalsService(studentId),
    enabled: !!studentId,
  });
};

export const useGetStudentBooks = (studentId: string) => {
  return useQuery({
    queryKey: ['studentBooks', studentId],
    queryFn: () => getStudentBooksService(studentId),
    enabled: !!studentId,
  });
};

/* ********** STUDENT MUTATIONS ********** */

export const useLoginStudentMutation = () => {
  return useMutation({
    mutationFn: loginStudentService,
    onSuccess: (data) => {
      // Store token and user data
      if (data.token) {
        localStorage.setItem('umi_student_auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user?.role || 'student');
      }
      console.log('Student login successful:', data);
    },
    onError: (error) => {
      // Handle login error
      console.error('Student login failed:', error);
    },
  });
};

export const useUpdateStudentProfileMutation = () => {
  return useMutation({
    mutationFn: updateStudentProfileService,
    onSuccess: (data) => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      console.log('Student profile updated successfully:', data);
    },
    onError: (error) => {
      console.error('Student profile update failed:', error);
    },
  });
};

export const useChangeStudentPasswordMutation = () => {
  return useMutation({
    mutationFn: changeStudentPasswordService,
    onSuccess: (data) => {
      console.log('Student password changed successfully:', data);
    },
    onError: (error) => {
      console.error('Student password change failed:', error);
    },
  });
};

export const useMarkStudentNotificationAsReadMutation = () => {
  return useMutation({
    mutationFn: markStudentNotificationAsReadService,
    onSuccess: (data) => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
      console.log('Student notification marked as read:', data);
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
};

export const useLogoutStudentMutation = () => {
  return useMutation({
    mutationFn: logoutStudentService,
    onSuccess: (data) => {
      // Clear stored authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('umi_student_auth_token');
      console.log('Student logout successful:', data);
    },
    onError: (error) => {
      console.error('Student logout failed:', error);
    },
  });
}; 

// --- RESEARCH REQUESTS ---

export const useGetStudentResearchRequests = () => {
  return useQuery({
    queryKey: ['studentResearchRequests'],
    queryFn: getStudentResearchRequestsService,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateStudentResearchRequest = () => {
  return useMutation({
    mutationFn: createStudentResearchRequestService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentResearchRequests'] });
    },
    onError: (error) => {
      // Optionally handle error
      console.error('Failed to create research request:', error);
    },
  });
};

// --- EVALUATIONS ---

export const useGetAvailableEvaluations = () => {
  return useQuery({
    queryKey: ['availableEvaluations'],
    queryFn: getAvailableEvaluationsService,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useGetStudentEvaluations = () => {
  return useQuery({
    queryKey: ['studentEvaluations'],
    queryFn: getStudentEvaluationsService,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubmitStudentEvaluation = () => {
  return useMutation({
    mutationFn: submitStudentEvaluationService,
    onSuccess: () => {
      // Invalidate and refetch evaluations after submission
      queryClient.invalidateQueries({ queryKey: ['availableEvaluations'] });
      queryClient.invalidateQueries({ queryKey: ['studentEvaluations'] });
    },
  });
};

// --- MESSAGING ---

export const useGetUnreadMessageCount = () => {
  return useQuery({
    queryKey: ['unreadMessageCount'],
    queryFn: getUnreadMessageCountService,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// --- DOCUMENTS ---

export const useGetStudentDocuments = () => {
  return useQuery({
    queryKey: ['studentDocuments'],
    queryFn: getStudentDocumentsService,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchInterval: false, // Don't auto-refetch, rely on manual invalidation
    refetchOnReconnect: true
  });
}; 

/* ********** RESEARCH CLINIC ********** */

export const useGetAvailableResearchClinicDays = () => {
  return useQuery({
    queryKey: ['availableResearchClinicDays'],
    queryFn: getAvailableResearchClinicDaysService,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });
};

export const useGetStudentResearchClinicBookings = () => {
  return useQuery({
    queryKey: ['studentResearchClinicBookings'],
    queryFn: getStudentResearchClinicBookingsService,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });
};

export const useBookResearchClinicSession = () => {
  return useMutation({
    mutationFn: bookResearchClinicSessionService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableResearchClinicDays'] });
      queryClient.invalidateQueries({ queryKey: ['studentResearchClinicBookings'] });
    },
  });
};

export const useCancelResearchClinicBooking = () => {
  return useMutation({
    mutationFn: cancelResearchClinicBookingService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableResearchClinicDays'] });
      queryClient.invalidateQueries({ queryKey: ['studentResearchClinicBookings'] });
    },
  });
}; 

/* ********** APPOINTMENTS ********** */

export const useGetAvailableAppointments = () => {
  return useQuery({
    queryKey: ['availableAppointments'],
    queryFn: getAvailableAppointmentsService,
  });
};

export const useGetStudentAppointments = () => {
  return useQuery({
    queryKey: ['studentAppointments'],
    queryFn: getStudentAppointmentsService,
  });
};

export const useBookAppointment = () => {
  return useMutation({
    mutationFn: bookAppointmentService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['studentAppointments'] });
    },
  });
};