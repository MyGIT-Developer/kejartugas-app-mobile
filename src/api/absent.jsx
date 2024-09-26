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
export const getAttendance = async (employeeId) => {
    try {
        const response = await apiService.get(`/attendance/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
            },
        });
        return response.data;
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

export const checkIn = async (employeeId, companyId, note, attendanceImageBase64, location, isWFH) => {
    try {
        const requestData = {
            company_id: parseInt(companyId),
            employee_id: employeeId,
            note: note,
            attendance_image: attendanceImageBase64, // Base64 encoded image
            location: location, // Assuming location is an object
            isWFH: isWFH,
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
        console.error('Check-in failed:', error.response.data.message);
        throw new Error(error.response.data.message || 'Checking in failed');
    }
};

export const checkOut = async (employeeId, companyId) => {
    try {
        const checkOutData = {
            action: 'checkout',
            employee_id: employeeId,
            company_id: companyId,
        };
        const response = await apiService.put(
            `/attendance/`,
            checkOutData,
            // {
            //     params: {
            //         action: 'checkout',
            //         company_id: companyId,
            //         employee_id: employeeId,
            //     },
            // },
            {
                headers: {
                    Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                },
            },
        );
        return response.data.message;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Checking out failed');
    }
};
