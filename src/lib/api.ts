/**
 * Admin API client for moderation endpoints
 */
import type {
  ContentReport,
  ContentReportDetail,
  ExtractionFeedback,
  UserModerationDetailEnhanced,
  UserListResponse,
  GetUsersParams,
  ModerationStatistics,
  ReportQueueResponse,
  FeedbackQueueResponse,
  DismissReportRequest,
  TakeActionRequest,
  ResolveFeedbackRequest,
  HideRecipeRequest,
  WarnUserRequest,
  SuspendUserRequest,
  BanUserRequest,
} from "@/types/admin";
import { supabase } from "./supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Cache for the current access token to avoid repeated getSession calls
let cachedAccessToken: string | null = null;

// Initialize token cache and listen for auth changes
if (supabase) {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    cachedAccessToken = session?.access_token ?? null;
  });

  // Listen for auth state changes to keep token updated
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.access_token ?? null;
  });
}

function getAuthHeaders(): Record<string, string> {
  if (!cachedAccessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${cachedAccessToken}`,
  };
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(error.detail || "Request failed", response.status);
  }

  return response.json();
}

// =============================================================================
// ADMIN IDENTITY
// =============================================================================

export interface AdminMeResponse {
  user_id: string;
  email?: string;
  is_admin: boolean;
}

export async function verifyAdmin(): Promise<AdminMeResponse> {
  return fetchApi<AdminMeResponse>("/admin/me");
}

// =============================================================================
// REPORTS
// =============================================================================

export async function getReports(params?: {
  status?: string;
  reason?: string;
  min_priority?: number;
  limit?: number;
  offset?: number;
}): Promise<ReportQueueResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.reason) searchParams.set("reason", params.reason);
  if (params?.min_priority) searchParams.set("min_priority", params.min_priority.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return fetchApi<ReportQueueResponse>(`/admin/reports${query ? `?${query}` : ""}`);
}

export async function getReport(reportId: string): Promise<ContentReportDetail> {
  return fetchApi<ContentReportDetail>(`/admin/reports/${reportId}`);
}

export async function dismissReport(
  reportId: string,
  data: DismissReportRequest
): Promise<ContentReport> {
  return fetchApi<ContentReport>(`/admin/reports/${reportId}/dismiss`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function takeActionOnReport(
  reportId: string,
  data: TakeActionRequest
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/reports/${reportId}/action`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// =============================================================================
// FEEDBACK
// =============================================================================

export async function getFeedback(params?: {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<FeedbackQueueResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return fetchApi<FeedbackQueueResponse>(`/admin/extraction-feedback${query ? `?${query}` : ""}`);
}

export async function getFeedbackItem(feedbackId: string): Promise<ExtractionFeedback> {
  return fetchApi<ExtractionFeedback>(`/admin/extraction-feedback/${feedbackId}`);
}

export async function resolveFeedback(
  feedbackId: string,
  data: ResolveFeedbackRequest
): Promise<ExtractionFeedback> {
  return fetchApi<ExtractionFeedback>(`/admin/extraction-feedback/${feedbackId}/resolve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// =============================================================================
// RECIPES
// =============================================================================

export async function hideRecipe(
  recipeId: string,
  data: HideRecipeRequest
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/recipes/${recipeId}/hide`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function unhideRecipe(
  recipeId: string,
  data: { reason: string }
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/recipes/${recipeId}/unhide`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// =============================================================================
// USERS
// =============================================================================

export async function getUsers(params?: GetUsersParams): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.is_premium !== undefined) searchParams.set("is_premium", params.is_premium.toString());
  if (params?.search) searchParams.set("search", params.search);
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return fetchApi<UserListResponse>(`/admin/users${query ? `?${query}` : ""}`);
}

export async function getUserModeration(userId: string): Promise<UserModerationDetailEnhanced> {
  return fetchApi<UserModerationDetailEnhanced>(`/admin/users/${userId}`);
}

export async function deleteUser(
  userId: string,
  reason: string
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/users/${userId}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}

export async function warnUser(
  userId: string,
  data: WarnUserRequest
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/users/${userId}/warn`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function suspendUser(
  userId: string,
  data: SuspendUserRequest
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/users/${userId}/suspend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function unsuspendUser(
  userId: string,
  data: { reason: string }
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/users/${userId}/unsuspend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function banUser(
  userId: string,
  data: BanUserRequest
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/users/${userId}/ban`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function unbanUser(
  userId: string,
  data: { reason: string }
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/users/${userId}/unban`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// =============================================================================
// STATISTICS
// =============================================================================

export async function getStatistics(): Promise<ModerationStatistics> {
  return fetchApi<ModerationStatistics>("/admin/statistics");
}
