import axios from 'axios';

const apiService = axios.create({
    // baseURL: 'https://app.kejartugas.com/api',
    baseURL: 'http://192.168.3.183:8000/api',
    timeout: 10000,
});

export default apiService;
