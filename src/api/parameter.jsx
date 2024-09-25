import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getParameter = async (companyId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get('/parameter', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                company_id: companyId,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
};
