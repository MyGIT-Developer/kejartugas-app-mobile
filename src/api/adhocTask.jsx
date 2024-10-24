import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAllAdhocTasks = async (companyId, employeeId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get('/task-adhoc/all-adhoc', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                company_id: companyId,
                employee_id: employeeId,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching adhoc tasks failed');
    }
};

export const getAdhocTaskDetail = async (adhocId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/task-adhoc/detail/${adhocId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching adhoc task detail failed');
    }
};

export const getMyAdhocTasks = async (employeeId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/task-adhoc/pending-assignee/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching my adhoc tasks failed');
    }
};

export const getPendingApprovalTasks = async (employeeId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/task-adhoc/pending-approver/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching pending approval tasks failed');
    }
};

export const getHistoryTasks = async (employeeId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/task-adhoc/history/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching closed assigner tasks failed');
    }
};
export const submitAdhocTask = async (adhocId, companyId, adhocImage, adhocReason = '') => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.put(
            `/task-adhoc/submit/${adhocId}`,
            {
                company_id: companyId,
                adhoc_image: adhocImage,
                adhoc_reason: adhocReason, // Optional field, only sent if provided
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Submitting adhoc task failed');
    }
};
export const cancelAdhocTask = async (adhocId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.put(
            `/task-adhoc/cancel/${adhocId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Canceling adhoc task failed');
    }
};

export const approveAdhocTask = async (adhocApprovalId, companyId, approvalComment) => {
    try {
        const token = await AsyncStorage.getItem('token'); // Fetch token from storage
        const response = await apiService.put(
            `/task-adhoc/approve/${adhocApprovalId}`, // API endpoint
            {
                company_id: companyId, // Include company_id
                approval_comment: approvalComment, // Include approval_comment
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`, // Add authorization header
                },
            },
        );
        return response.data; // Return response data
    } catch (error) {
        console.log('API response error:', error.response?.data); // Log API error response for debugging
        throw new Error(error.response?.data?.message || 'Approving adhoc task failed'); // Throw error
    }
};

export const rejectAdhocTask = async (adhocApprovalId, companyId, approvalComment) => {
    try {
        const token = await AsyncStorage.getItem('token'); // Fetch token from storage
        const response = await apiService.put(
            `/task-adhoc/reject/${adhocApprovalId}`, // API endpoint with approval ID
            {
                company_id: companyId, // Include company_id in the request body
                approval_comment: approvalComment, // Include approval_comment
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`, // Add authorization header
                },
            },
        );
        return response.data; // Return response data
    } catch (error) {
        console.log('API response error:', error.response?.data); // Log API error response for debugging
        throw new Error(error.response?.data?.message || 'Rejecting adhoc task failed'); // Throw error
    }
};
