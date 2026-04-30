import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let onAuthError: (() => void) | null = null;
export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (onAuthError) onAuthError();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  checkFirstUser: () => api.get('/auth/check-first-user'),

  register: (userData: {
    username: string; email: string; name: string; password: string;
    year_of_study: number; semester_of_study: number; group?: string;
    specialization?: string; verification_method: 'email' | 'sms'; phone_number?: string;
  }) => api.post('/auth/register', userData),

  login: (credentials: { login: string; password: string; remember_me?: boolean }) =>
    api.post('/auth/login', credentials),

  verifySms: (data: { identifier: string; code: string }) =>
    api.post('/auth/verify-sms', data),

  resendVerification: (email: string, forceEmail = false) =>
    api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}&force_email=${forceEmail}`),

  forgotPassword: (emailOrPhone: string) =>
    api.post('/auth/forgot-password', { email_or_phone: emailOrPhone }),

  resetPasswordLink: (data: { token: string; new_password: string }) =>
    api.post('/auth/reset-password-link', data),

  resetPasswordSms: (data: { phone_number: string; code: string; new_password: string }) =>
    api.post('/auth/reset-password-sms', data),

  updatePhoneBeforeVerify: (email: string, phone_number: string) =>
    api.post(`/auth/update-phone?email=${encodeURIComponent(email)}`, { phone_number }),

  requestAccountDeletion: (verificationMethod: 'email' | 'sms') =>
    api.post(`/auth/request-account-deletion?verification_method=${verificationMethod}`),

  confirmAccountDeletion: (data: { email_or_phone: string; code: string; verification_method: 'email' | 'sms' }) =>
    api.post('/auth/confirm-account-deletion', data),
};

export const groupsAPI = {
  getGroups: () => api.get('/groups'),
};

export const reviewsAPI = {
  addNoteReview: (noteId: string, data: { content: string; rating: number }) =>
    api.post(`/notes/${noteId}/review`, data),
  addPaperReview: (paperId: string, data: { content: string; rating: number }) =>
    api.post(`/past-papers/${paperId}/review`, data),
  addBlogReview: (blogId: string, data: { content: string; rating: number }) =>
    api.post(`/blogs/${blogId}/review`, data),
  getNoteReviews: (noteId: string) => api.get(`/notes/${noteId}/reviews`),
  getPaperReviews: (paperId: string) => api.get(`/past-papers/${paperId}/reviews`),
  getBlogReviews: (blogId: string) => api.get(`/blogs/${blogId}/reviews`),
  deleteNoteReview: (noteId: string, reviewId: string) => api.delete(`/notes/${noteId}/reviews/${reviewId}`),
  deletePaperReview: (paperId: string, reviewId: string) => api.delete(`/past-papers/${paperId}/reviews/${reviewId}`),
  deleteBlogReview: (blogId: string, reviewId: string) => api.delete(`/blogs/${blogId}/reviews/${reviewId}`),
  replyToNoteReview: (noteId: string, reviewId: string, reply: string) =>
    api.post(`/notes/${noteId}/reviews/${reviewId}/reply`, { reply }),
  replyToPaperReview: (paperId: string, reviewId: string, reply: string) =>
    api.post(`/past-papers/${paperId}/reviews/${reviewId}/reply`, { reply }),
  replyToBlogReview: (blogId: string, reviewId: string, reply: string) =>
    api.post(`/blogs/${blogId}/reviews/${reviewId}/reply`, { reply }),
  flagNoteReview: (noteId: string, reviewId: string) =>
    api.post(`/notes/${noteId}/reviews/${reviewId}/flag`),
  flagPaperReview: (paperId: string, reviewId: string) =>
    api.post(`/past-papers/${paperId}/reviews/${reviewId}/flag`),
  flagBlogReview: (blogId: string, reviewId: string) =>
    api.post(`/blogs/${blogId}/reviews/${reviewId}/flag`),
  approveNoteReview: (noteId: string, reviewId: string) =>
    api.post(`/notes/${noteId}/reviews/${reviewId}/approve`),
  approvePaperReview: (paperId: string, reviewId: string) =>
    api.post(`/past-papers/${paperId}/reviews/${reviewId}/approve`),
  approveBlogReview: (blogId: string, reviewId: string) =>
    api.post(`/blogs/${blogId}/reviews/${reviewId}/approve`),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: {
    name: string; year_of_study: number; semester_of_study: number;
    group?: string; specialization?: string;
  }) => api.put('/user/profile', data),
  updateProfilePicture: (profile_picture: string) =>
    api.post('/user/update-profile-picture', { profile_picture }),
  requestEmailChange: (new_email: string) =>
    api.post('/user/request-email-change', { new_email }),
  requestPhoneChange: (new_phone: string) =>
    api.post('/user/request-phone-change', { new_phone }),
  confirmPhoneChange: (code: string) =>
    api.post('/user/confirm-phone-change', { code }),
  updateNotificationPreferences: (notify_on_upload_decision: boolean) =>
    api.put('/user/notification-preferences', { notify_on_upload_decision }),
};

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

export const notesAPI = {
  getNotes: (params?: { year?: number; semester?: number; specialization?: string; group?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/notes', { params }),
  getNote: (id: string) => api.get(`/notes/${id}`),
  viewNote: (id: string) => api.get(`/notes/view/${id}`, { responseType: 'blob' }),
  getMyUploads: (params?: { page?: number; limit?: number }) => api.get('/notes/my-uploads', { params }),
  uploadNote: (data: {
    course_title: string; course_code: string; year_of_study: number;
    semester_of_study: number; group?: string; specialization?: string;
    file_url: string; thumbnail_url?: string; description?: string;
  }) => api.post('/notes/upload', data),
  deleteNote: (id: string) => api.delete(`/notes/${id}`),
};

export const pastPapersAPI = {
  getPastPapers: (params?: { year?: number; semester?: number; specialization?: string; group?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/past-papers', { params }),
  getPastPaper: (id: string) => api.get(`/past-papers/${id}`),
  viewPastPaper: (id: string) => api.get(`/past-papers/view/${id}`, { responseType: 'blob' }),
  getMyPapers: (params?: { page?: number; limit?: number }) => api.get('/past-papers/my-uploads', { params }),
  uploadPaper: (data: {
    course_title: string; course_code: string; year_of_study: number;
    semester_of_study: number; group?: string; specialization?: string;
    file_url: string; thumbnail_url?: string; description?: string;
  }) => api.post('/past-papers/upload', data),
  deletePaper: (id: string) => api.delete(`/past-papers/${id}`),
};

export const adminAPI = {
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) =>
    api.get('/admin/users', { params }),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  getPendingNotes: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/notes/pending', { params }),
  updateNoteStatus: (id: string, data: { status: string; feedback?: string }) =>
    api.put(`/admin/notes/${id}`, data),
  updateNote: (id: string, data: any) => api.put(`/admin/notes/${id}/edit`, data),

  getPendingPapers: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/past-papers/pending', { params }),
  updatePaperStatus: (id: string, data: { status: string; feedback?: string }) =>
    api.put(`/admin/past-papers/${id}`, data),
  updatePaper: (id: string, data: any) => api.put(`/admin/past-papers/${id}/edit`, data),

  createBlog: (data: { title: string; content: string; thumbnail_url?: string; target_group?: string }) =>
    api.post('/admin/blogs', data),
  updateBlog: (id: string, data: { title: string; content: string; thumbnail_url?: string; target_group?: string }) =>
    api.put(`/admin/blogs/${id}`, data),
  deleteBlog: (id: string) => api.delete(`/admin/blogs/${id}`),

  getAllNotes: (params?: { page?: number; limit?: number; search?: string; group?: string; specialization?: string; year?: number; semester?: number }) =>
    api.get('/notes', { params }),
  getAllPapers: (params?: { page?: number; limit?: number; search?: string; group?: string; specialization?: string; year?: number; semester?: number }) =>
    api.get('/past-papers', { params }),
  deleteNote: (id: string) => api.delete(`/notes/${id}`),
  deletePaper: (id: string) => api.delete(`/past-papers/${id}`),

  getGroups: () => api.get('/admin/groups'),
  createGroup: (data: { name: string; code: string; description?: string; specializations?: string[] }) =>
    api.post('/admin/groups', data),
  updateGroup: (groupId: string, data: { name?: string; description?: string }) =>
    api.put(`/admin/groups/${groupId}`, data),
  deleteGroup: (groupId: string) => api.delete(`/admin/groups/${groupId}`),
  addSpecialization: (groupId: string, name: string) =>
    api.post(`/admin/groups/${groupId}/specializations`, { name }),
  removeSpecialization: (groupId: string, specName: string) =>
    api.delete(`/admin/groups/${groupId}/specializations/${encodeURIComponent(specName)}`),
};

export const blogAPI = {
  getBlogs: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/blogs', { params }),
  getBlog: (id: string) => api.get(`/blogs/${id}`),
};

export const profileAPI = {
  updateProfilePicture: (profile_picture: string) =>
    api.post('/user/update-profile-picture', { profile_picture }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put('/user/change-password', data),
  deleteAccount: (data: { email: string; code: string }) =>
    api.post('/auth/confirm-account-deletion', data),
};

export default api;
