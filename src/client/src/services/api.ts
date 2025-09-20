import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, User, AuthTokens, LoginCredentials, RegisterData, Group, CreateGroupInput, UpdateGroupInput, Expense, CreateExpenseInput, UpdateExpenseInput, Balance, ExpenseCategory, GroupMember, ExpenseSplit } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta?.env?.VITE_API_URL || 'http://localhost:3001';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.clearAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private setAuthToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  private clearAuthToken(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        error: error.message || 'An unexpected error occurred',
        code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Auth API
  async register(data: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.request({
      method: 'POST',
      url: '/api/auth/register',
      data
    });
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>({
      method: 'POST',
      url: '/api/auth/login',
      data: credentials
    });

    if (response.success && response.data?.tokens) {
      this.setAuthToken(response.data.tokens.accessToken);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request({
      method: 'POST',
      url: '/api/auth/logout'
    });

    this.clearAuthToken();
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request({
      method: 'GET',
      url: '/api/auth/me'
    });
  }

  // Groups API
  async getGroups(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<{ groups: Group[] }>> {
    return this.request({
      method: 'GET',
      url: '/api/groups',
      params
    });
  }

  async getGroup(id: string): Promise<ApiResponse<{ group: Group }>> {
    return this.request({
      method: 'GET',
      url: `/api/groups/${id}`
    });
  }

  async createGroup(data: CreateGroupInput): Promise<ApiResponse<{ group: Group }>> {
    return this.request({
      method: 'POST',
      url: '/api/groups',
      data
    });
  }

  async updateGroup(id: string, data: UpdateGroupInput): Promise<ApiResponse<{ group: Group }>> {
    return this.request({
      method: 'PUT',
      url: `/api/groups/${id}`,
      data
    });
  }

  async deleteGroup(id: string): Promise<ApiResponse<{ groupId: string }>> {
    return this.request({
      method: 'DELETE',
      url: `/api/groups/${id}`
    });
  }

  async addGroupMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<ApiResponse<{ member: GroupMember }>> {
    return this.request({
      method: 'POST',
      url: `/api/groups/${groupId}/members`,
      data: { userId, role }
    });
  }

  async removeGroupMember(groupId: string, userId: string): Promise<ApiResponse<{ groupId: string; userId: string }>> {
    return this.request({
      method: 'DELETE',
      url: `/api/groups/${groupId}/members/${userId}`
    });
  }

  async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<ApiResponse<{ member: any }>> {
    return this.request({
      method: 'PUT',
      url: `/api/groups/${groupId}/members/${userId}/role`,
      data: { role }
    });
  }


  // Invitation API calls
  async inviteGroupMember(groupId: string, data: {
    email: string;
    role?: 'admin' | 'member';
  }): Promise<ApiResponse<{ invitation: any }>> {
    return this.request({
      method: 'POST',
      url: `/api/groups/${groupId}/invitations`,
      data
    });
  }

  async getGroupInvitations(groupId: string): Promise<ApiResponse<{ invitations: any[] }>> {
    return this.request({
      method: 'GET',
      url: `/api/groups/${groupId}/invitations`
    });
  }

  async getInvitation(token: string): Promise<ApiResponse<{ invitation: any }>> {
    return this.request({
      method: 'GET',
      url: `/api/invitations/${token}`
    });
  }

  async acceptInvitation(token: string): Promise<ApiResponse<{ group: any; member: any }>> {
    return this.request({
      method: 'POST',
      url: '/api/invitations/accept',
      data: { token }
    });
  }

      async cancelInvitation(invitationId: string): Promise<ApiResponse> {
        return this.request({
          method: 'DELETE',
          url: `/api/invitations/${invitationId}`
        });
      }

      // Activity API calls
      async getGroupActivities(groupId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ activities: any[] }>> {
        return this.request({
          method: 'GET',
          url: `/api/groups/${groupId}/activities`,
          params
        });
      }

      // Export API calls
      async exportGroupData(groupId: string, params: {
        format: 'json' | 'csv' | 'pdf';
        includeExpenses?: boolean;
        includeMembers?: boolean;
        includeActivities?: boolean;
        dateRange?: string;
        startDate?: string;
        endDate?: string;
      }): Promise<ApiResponse<{ downloadUrl: string }>> {
        return this.request({
          method: 'POST',
          url: `/api/groups/${groupId}/export`,
          data: params
        });
      }

  // Expenses API
  async getExpenses(params?: { 
    group_id?: string; 
    page?: number; 
    limit?: number; 
    category?: string; 
    date_from?: string; 
    date_to?: string; 
  }): Promise<ApiResponse<Expense[]>> {
    return this.request({
      method: 'GET',
      url: '/api/expenses',
      params
    });
  }

  async createExpense(data: CreateExpenseInput): Promise<ApiResponse<{ expense: Expense }>> {
    return this.request({
      method: 'POST',
      url: '/api/expenses',
      data
    });
  }

  async getExpense(id: string): Promise<ApiResponse<{ expense: Expense }>> {
    return this.request({
      method: 'GET',
      url: `/api/expenses/${id}`
    });
  }

  async updateExpense(id: string, data: UpdateExpenseInput): Promise<ApiResponse<{ expense: Expense }>> {
    return this.request({
      method: 'PUT',
      url: `/api/expenses/${id}`,
      data
    });
  }

  async deleteExpense(id: string): Promise<ApiResponse<{ expenseId: string }>> {
    return this.request({
      method: 'DELETE',
      url: `/api/expenses/${id}`
    });
  }

  // Balance API
  async getGroupBalances(groupId: string): Promise<ApiResponse<{
    totalExpenses: number;
    totalSettled: number;
    totalOutstanding: number;
    memberCount: number;
    balances: Balance[];
  }>> {
    return this.request({
      method: 'GET',
      url: `/api/balances/group/${groupId}`
    });
  }

  async getGroupSettlements(groupId: string): Promise<ApiResponse<{
    settlements: any[];
    totalSettlements: number;
    totalAmount: number;
  }>> {
    return this.request({
      method: 'GET',
      url: `/api/balances/group/${groupId}/settlements`
    });
  }

  async getUserBalance(groupId: string, userId: string): Promise<ApiResponse<Balance>> {
    return this.request({
      method: 'GET',
      url: `/api/balances/group/${groupId}/user/${userId}`
    });
  }

  async getBalanceHistory(groupId: string, limit?: number): Promise<ApiResponse<{
    history: any[];
    totalRecords: number;
  }>> {
    return this.request({
      method: 'GET',
      url: `/api/balances/group/${groupId}/history`,
      params: { limit }
    });
  }

  async validateBalances(groupId: string): Promise<ApiResponse<{
    isValid: boolean;
    error?: string;
    totalMembers: number;
    totalNetBalance: number;
  }>> {
    return this.request({
      method: 'POST',
      url: `/api/balances/group/${groupId}/validate`
    });
  }

  async settleExpense(id: string): Promise<ApiResponse<{ expense: Expense }>> {
    return this.request({
      method: 'POST',
      url: `/api/expenses/${id}/settle`
    });
  }

  async payExpenseSplit(expenseId: string, splitId: string): Promise<ApiResponse<{ split: ExpenseSplit }>> {
    return this.request({
      method: 'POST',
      url: `/api/expenses/${expenseId}/splits/${splitId}/pay`
    });
  }

  async getExpenseCategories(): Promise<ApiResponse<{ categories: ExpenseCategory[] }>> {
    return this.request({
      method: 'GET',
      url: '/api/expenses/categories'
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: '/health'
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
