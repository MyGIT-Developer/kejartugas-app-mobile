import apiService from '../utils/apiService';

export const login = async (username, password) => {
    try {
        const response = await apiService.post('/login', { username, password });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};

// Function for generating a password reset code
export const generateResetCode = async (email) => {
    try {
        const response = await apiService.post('/forgot-password/code', { email });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to generate reset code');
    }
};

// Function for resetting the password with OTP and new password
export const forgotPassword = async (email, otp_code, password) => {
    try {
        const response = await apiService.post('/forgot-password', {
            email,
            otp_code,
            password,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
};
