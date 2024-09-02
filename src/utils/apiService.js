import axios from 'axios';

const apiService = axios.create({
    baseURL: 'https://app.kejartugas.com/api',
    timeout: 10000,
});

export default apiService;
