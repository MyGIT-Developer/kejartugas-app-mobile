import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchTotalTasksForEmployee = async (employeeId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/total-taskinemployee/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching total tasks failed');
    }
};

export const addNewTask = async (formData) => {
    console.log('Adding new task with formData:', formData);
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.post(`/tasks`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error || 'Adding new task failed');
    }
};

export const updateTask = async (id, formData, jobsId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.put(`/tasks/${id}`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                jobs_id: jobsId,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error || 'Adding new task failed');
    }
};

export const submitTask = async (taskId, payload) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.put(`/tasks/${taskId}/submit`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Task submission failed');
    }
};

export const fetchTaskById = async (taskId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/tasks/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data; // Return the data field directly
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching task failed');
    }
};

// apiService.js or the appropriate file for your API functions
export const fetchChatByTaskId = async (taskId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/chat/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data; // Return the data field directly
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching chat messages failed');
    }
};

export const sendChatMessage = async (employeeId, taskId, message, companyId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const payload = {
            employee_id: employeeId,
            tasks_id: taskId,
            message: message,
            company_id: companyId,
        };

        console.log('Sending chat message with payload:', payload);

        const response = await apiService.post(`/chat`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data; // Return the data field directly
    } catch (error) {
        console.error('Error in sendChatMessage:', error);
        throw new Error(error.response?.data?.message || 'Sending chat message failed');
    }
};

export const deleteTask = async (taskId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.delete(`/tasks/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data; // Return the data field directly
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Deleting task failed');
    }
};

export const approveTask = async (taskId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.put(
            `/tasks/${taskId}/review`,
            {
                isAccepted: true,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        return response.data; // Return the data field directly
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Approving task failed');
    }
};

export const rejectTask = async (taskId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.put(
            `/tasks/${taskId}/review`,
            {
                isAccepted: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        return response.data; // Return the data field directly
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Rejecting task failed');
    }
};
