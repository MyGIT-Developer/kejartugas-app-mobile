import apiService from "../utils/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getTeamsByCompany = async (companyId) => {
    try {
        const response = await apiService.get(`/teams/company/${companyId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`
            }
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
}

export const getJobsByCompany = async (companyId) => {
    try {
        const response = await apiService.get(`/jobs/company/${companyId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`
            }
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
}

export const getEmployeeByCompany = async (companyId) => {
    try {
        const response = await apiService.get(`/employees/company/${companyId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`
            }
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error || 'Creating project failed');
    }
}