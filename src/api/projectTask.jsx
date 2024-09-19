import apiService from "../utils/apiService";

export const getProject = async (companyId) => {
    try {
        const response = await apiService.get(`/projects/company/${companyId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
}