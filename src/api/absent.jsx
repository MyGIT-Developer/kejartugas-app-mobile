import apiService from '../utils/apiService';

// Function to mark an employee as absent
export const markAbsent = async (companyId, employeeId, note, attendance_image, location) => {
    try {
        const response = await apiService.post(`/attendance/`, {companyId, employeeId, note, attendance_image, location});
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Marking absent failed');
    }
};

// Function to get attendance details for an employee
export const getAttendance = async (employeeId) => {
    try {
        const response = await apiService.get(`/attendance/${employeeId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching attendance failed');
    }
};

// Function to get the attendance report for all employees
export const getAttendanceReport = async () => {
    try {
        const response = await apiService.get('/attendance/report');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching report failed');
    }
};

// Function to update attendance for a specific employee
export const updateAttendance = async (employeeId, data) => {
    try {
        const response = await apiService.put(`/attendance/${employeeId}`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Updating attendance failed');
    }
};

// Function to delete attendance record for a specific employee
export const deleteAttendance = async (employeeId) => {
    try {
        const response = await apiService.delete(`/attendance/${employeeId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Deleting attendance failed');
    }
};
