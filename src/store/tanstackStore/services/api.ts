import apiRequest from "../../../utils/apiRequestUrl"
import { queryClient } from "../../../utils/tanstack"

/* ********** ERROR HANDLING ********** */

const errorHandling = (error: any) => {
    if (error?.response) {
        throw {message: `Error ${error.response.status}: ${error.response.statusText}. ${error.response?.data?.message}`}
    } else if (error.request) {
        throw {message: "No response from server. Please check your network connection."}
    } else {
        throw {message: `Request failed: ${error.message}`}
    }
}

/* ********** STUDENT API SERVICES ********** */

export const loginStudentService = async (user: any) => {
    try {
        const response = await apiRequest.post("/student/login", user);
        const { token, role } = response.data;
        localStorage.setItem('role', role);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getLoggedInUserService = async () => {
    try {
        const response = await apiRequest.get("/student/logged-in-user");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentProfileService = async () => {
    try {
        const response = await apiRequest.get("/student/profile");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const updateStudentProfileService = async (data: any) => {
    try {
        const response = await apiRequest.put("/student/profile", data);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const changeStudentPasswordService = async (data: any) => {
    try {
        const response = await apiRequest.put("/student/password", data);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentDashboardStatsService = async () => {
    try {
        const response = await apiRequest.get("/student/dashboard/stats");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentNotificationsService = async () => {
    try {
        const response = await apiRequest.get("/student/notifications");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const markStudentNotificationAsReadService = async (notificationId: string) => {
    try {
        const response = await apiRequest.put(`/student/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const logoutStudentService = async () => {
    try {
        const response = await apiRequest.post("/student/logout");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

/* ********** STUDENT STATUS, PROPOSAL, AND BOOK SERVICES ********** */

export const getStudentStatusesService = async (studentId: string) => {
    try {
        const response = await apiRequest.get(`/student/statuses/${studentId}`);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentProposalsService = async (studentId: string) => {
    try {
        const response = await apiRequest.get(`/student/proposals/${studentId}`);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentBooksService = async (studentId: string) => {
    try {
        const response = await apiRequest.get(`/student/books/${studentId}`);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

// ********** RESEARCH REQUESTS **********

export const getStudentResearchRequestsService = async () => {
    try {
        const response = await apiRequest.get("/student/research-requests");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const createStudentResearchRequestService = async (data: any) => {
    try {
        const response = await apiRequest.post("/student/research-requests", data);
        queryClient.invalidateQueries({queryKey: ['studentResearchRequests']});
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getUnreadMessageCountService = async () => {
    try {
        const response = await apiRequest.get("/messages/unread-count");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

// ********** EVALUATION SERVICES **********

export const getAvailableEvaluationsService = async () => {
    try {
        const response = await apiRequest.get("/student/evaluations/available");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const submitStudentEvaluationService = async (evaluationData: any) => {
    try {
        const response = await apiRequest.post("/student/evaluations", evaluationData);
        queryClient.invalidateQueries({queryKey: ['availableEvaluations']});
        queryClient.invalidateQueries({queryKey: ['studentEvaluations']});
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentEvaluationsService = async () => {
    try {
        const response = await apiRequest.get("/student/evaluations");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

// ********** DOCUMENT MANAGEMENT SERVICES **********

export const uploadDocumentService = async (formData: FormData) => {
    try {
        const response = await apiRequest.post("/student/documents", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentDocumentsService = async () => {
    try {
        const response = await apiRequest.get("/student/documents");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const downloadDocumentService = async ({ documentId, filename }: { documentId: string; filename: string }) => {
    try {
        const response = await apiRequest.get(`/student/documents/${documentId}/download`, {
            responseType: 'blob'
        });
        return response; // Return the full response instead of just response.data
    } catch (error) {
        errorHandling(error);
    }
};

export const deleteDocumentService = async (documentId: string) => {
    try {
        const response = await apiRequest.delete(`/student/documents/${documentId}`);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentSupervisorsService = async () => {
    try {
        const response = await apiRequest.get("/student/supervisors-for-messaging");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

/* ********** RESEARCH CLINIC SERVICES ********** */

export const getAvailableResearchClinicDaysService = async () => {
    try {
        const response = await apiRequest.get("/student/research-clinic-days");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const bookResearchClinicSessionService = async (data: any) => {
    try {
        const response = await apiRequest.post("/student/research-clinic-bookings", data);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentResearchClinicBookingsService = async () => {
    try {
        const response = await apiRequest.get("/student/research-clinic-bookings");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const cancelResearchClinicBookingService = async (bookingId: string) => {
    try {
        const response = await apiRequest.put(`/student/research-clinic-bookings/${bookingId}/cancel`);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

/* ********** APPOINTMENTS ********** */

export const getAvailableAppointmentsService = async () => {
    try {
        const response = await apiRequest.get("/student/appointments/availability");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const bookAppointmentService = async (data: any) => {
    try {
        const response = await apiRequest.post("/student/appointments", data);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const getStudentAppointmentsService = async () => {
    try {
        const response = await apiRequest.get("/student/appointments");
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const rescheduleAppointmentService = async (data: { appointmentId: string; newAvailabilityId: string; notes?: string }) => {
    try {
        const response = await apiRequest.put(`/student/appointments/${data.appointmentId}/reschedule`, {
            newAvailabilityId: data.newAvailabilityId,
            notes: data.notes
        });
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};

export const cancelAppointmentService = async (appointmentId: string) => {
    try {
        const response = await apiRequest.put(`/student/appointments/${appointmentId}/cancel`);
        return response.data;
    } catch (error) {
        errorHandling(error);
    }
};