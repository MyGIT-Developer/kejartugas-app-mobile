import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to mark an employee as absent
export const markAbsent = async (companyId, employeeId, note, attendance_image, location) => {
    try {
        const response = await apiService.post(
            `/attendance/`,
            {
                companyId,
                employeeId,
                note,
                attendance_image,
                location,
            },
            {
                headers: {
                    Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
            },
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Marking absent failed');
    }
};

// Function to get attendance details for an employee
export const getAttendance = async (employeeId, page = 1, limit = 50) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/attendance/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                page,
                limit,
                weekly_only: true,
            },
        });
        return response.data; // Should return { data: [...], pagination: {...} }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching attendance failed');
    }
};

// Function to get the attendance report for all employees
export const getAttendanceReport = async () => {
    try {
        const response = await apiService.get(
            '/attendance/report',
            {
                headers: {
                    Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
            },
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching report failed');
    }
};

export const checkIn = async (employeeId, companyId, note, attendanceImageBase64, location, isWFH, clientId = null) => {
    try {
        const requestData = {
            company_id: parseInt(companyId),
            employee_id: employeeId,
            note: note,
            attendance_image: attendanceImageBase64, // Base64 encoded image
            location: location, // Assuming location is an object
            isWFH: isWFH,
            client_id: clientId, // Add client_id to the request
        };

        // Send POST request using apiService (no need for FormData, just a JSON payload)
        const response = await apiService.post(`/attendance/`, requestData, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
            },
        });

        return response.data;
    } catch (error) {
        // Error handling
        console.error('Check-in failed:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Checking in failed');
    }
};

export const checkOut = async (employeeId, companyId, location, location_name) => {
    try {
        const checkOutData = {
            action: 'checkout',
            employee_id: employeeId,
            company_id: companyId,
            location: location,
            location_name: location_name,
        };

        const response = await apiService.put(
            `/attendance/`,
            checkOutData, // Correct payload here
            {
                params: {
                    action: 'checkout',
                    company_id: companyId,
                    employee_id: employeeId,
                    location_name: location_name,
                },
                headers: {
                    Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
            },
        );

        if (!response || !response.data) {
            throw new Error('No response data received from server');
        }

        return response.data; // Ensure it returns the full response, not just `message`
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Checking out failed');
    }
};
