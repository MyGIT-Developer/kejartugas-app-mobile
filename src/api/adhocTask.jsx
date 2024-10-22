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
