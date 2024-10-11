import apiService from "../utils/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getProject = async (companyId) => {
    try {
        const response = await apiService.get(`/projects/company/${companyId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
}

export const getProjectById = async (projectId) => {
    try {
        const response = await apiService.get(`/projects/${projectId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`
            }
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
}

export const CreateProject = async (formdata) => {
    try {
        const response = await apiService.post(`/projects/`, {
            ...formdata,
            project_status: "onPending",
          }, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error || 'Creating project failed');
    }
}

export const getTask = async (companyId) => {
    try {
        const response = await apiService.get(`/tasks`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`
            },
            params: {
                company_id: companyId
            }
        });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
}