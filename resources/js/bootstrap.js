import axios from 'axios';
import { clearSession, TOKEN_KEY } from './authStore';

const token = window.localStorage.getItem('sices_token');

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.baseURL = '/api/v1';

if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
}

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            clearSession();
            delete axios.defaults.headers.common.Authorization;
            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
            return Promise.reject(error);
        }

        return Promise.reject(error);
    },
);

window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY && !event.newValue) {
        delete axios.defaults.headers.common.Authorization;
    }
});

export default axios;
