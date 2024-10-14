import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getTeamsByCompany = async (companyId) => {
    try {
        const response = await apiService.get(`/teams/company/${companyId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
            },
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
};

export const getJobsByCompany = async (companyId) => {
    try {
        const response = await apiService.get(`/jobs/company/${companyId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
            },
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
};

export const getEmployeeByCompany = async (companyId) => {
    try {
        const response = await apiService.get(`/employees/company/${companyId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
            },
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error || 'Creating project failed');
    }
};

export const getHomeData = async (companyId, employeeId, roleId, token) => {
    try {
        const response = await apiService.get(`/dashboard`, {
            params: {
                company_id: companyId,
                employee_id: employeeId,
                role_id: roleId,
                // start_date: searchedFromDate,
                // end_date: searchedUntilDate,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data.data;
    } catch (error) {
        console.error('Error fetching home data:', error);
        return null; // Return null or another fallback value in case of an error
    }
};

export const getEmployeeById = async (employeeId) => {
    try {
        const response = await apiService.get(`/employees/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
            },
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
};
