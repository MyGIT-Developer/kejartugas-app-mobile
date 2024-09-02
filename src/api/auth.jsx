import apiService from '../utils/apiService';


export const login = async (username, password) => {
    try {
        const response = await apiService.post('/login', { username, password });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};
