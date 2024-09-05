import apiService from "../utils/apiService";

export const getParameter = async (companyId) => {
    try {
        const response = await apiService.get('/parameter', {
            params : {
                company_id: companyId
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching parameter failed');
    }
}