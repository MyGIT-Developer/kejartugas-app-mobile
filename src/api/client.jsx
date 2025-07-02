import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get all clients by company ID
export const getClientsByCompanyId = async (companyId) => {
    try {
        console.log('Fetching clients for company ID:', companyId);

        const token = await AsyncStorage.getItem('token');
        console.log('Token exists:', !!token);

        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log(`Making request to: /clients/${companyId}`);

        const response = await apiService.get(`/clients/${companyId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log('Raw API response:', response.data);

        return response.data;
    } catch (error) {
        console.error('Error fetching clients - Full error:', error);

        if (error.response) {
            // Server responded with error status
            console.log('Server error response:', error.response.status, error.response.data);
            const message = error.response.data?.message || `Server error: ${error.response.status}`;
            throw new Error(message);
        } else {
            // Request/network error
            console.log('Network/request error:', error.message);
            throw new Error(error.message || 'Terjadi kesalahan saat mengambil data klien');
        }
    }
};
