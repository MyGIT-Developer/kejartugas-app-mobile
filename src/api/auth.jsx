import apiService from '../utils/apiService';

export const login = async (username, password) => {
    try {
        const response = await apiService.post('/login', { username, password });
        return response.data;
    } catch (error) {
        // Rethrow the original error so callers can inspect error.response
        throw error;
    }
};

export const loginMobile = async (username, password) => {
    try {
        const response = await apiService.post('/loginMobile', { username, password });
        return response.data;
    } catch (error) {
        // Rethrow the original error so callers can inspect error.response
        throw error;
    }
};

// Function for generating a password reset code
export const generateResetCode = async (email) => {
    try {
        const response = await apiService.post('/forgot-password/code', { email });
        return response.data;
    } catch (error) {
        throw error;
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
        throw error;
    }
};

export const registerCompanies = async (
    company_name,
    company_email,
    username,
    employee_name,
    password,
    company_image,
) => {
    try {
        const response = await apiService.post('/companies', {
            company_name,
            company_email, // Correct parameter name
            employee_name,
            username,
            password,
            company_image,
        });
        return response.data;
    } catch (error) {
        // Rethrow original error so caller can decide how to format message
        throw error;
    }
};
