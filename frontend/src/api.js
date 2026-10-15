import { BASE_URL } from './config';

async function request(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const err = new Error(`Cannot reach server at ${BASE_URL}`);
    err.status = 0;
    throw err;
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  login: (username, password) => request('/api/login', { method: 'POST', body: { username, password } }),
  getEmployees: (token) => request('/api/employees', { token }),
  addEmployee: (token, emp) => request('/api/employees', { method: 'POST', body: emp, token }),
  toggleStatus: (token, id) => request(`/api/employees/${id}/status`, { method: 'PUT', token }),
  deleteEmployee: (token, id) => request(`/api/employees/${id}`, { method: 'DELETE', token }),
  getSalaryClusters: (token) => request('/api/employees/salary-clusters', { token }),
};
