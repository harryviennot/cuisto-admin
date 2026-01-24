/**
 * Admin dashboard types - matching backend schemas
 */

// =============================================================================
// ENUMS
// =============================================================================

export type ReportStatus = "pending" | "in_review" | "resolved" | "escalated";

export type ContentReportReason =
  | "inappropriate_content"
  | "hate_speech"
  | "copyright_violation"
  | "spam_advertising"
  | "misinformation"
  | "other";

export type ExtractionFeedbackCategory =
  | "wrong_ingredients"
  | "missing_steps"
  | "incorrect_steps"
  | "bad_formatting"
  | "wrong_measurements"
  | "wrong_servings"
  | "ai_hallucination"
  | "wrong_title"
  | "wrong_image"
  | "other";

export type UserModerationStatus =
  | "good_standing"
  | "warned"
  | "suspended"
  | "banned";

export type ModerationActionType =
  | "dismiss_report"
  | "hide_recipe"
  | "unhide_recipe"
  | "warn_user"
  | "suspend_user"
  | "unsuspend_user"
  | "ban_user"
  | "unban_user"
  | "resolve_feedback";

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface UserSummary {
  id: string;
  name?: string;
  avatar_url?: string;
}

export interface RecipeSummary {
  id: string;
  title: string;
  image_url?: string;
  created_by?: string;
  is_public?: boolean;
  source_url?: string;
}

export interface RecipeDetail extends RecipeSummary {
  description?: string;
  ingredients?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  instructions?: Array<{
    step_number: number;
    title: string;
    description: string;
  }>;
}

// =============================================================================
// CONTENT REPORTS
// =============================================================================

export interface ContentReport {
  id: string;
  recipe_id: string;
  reporter_user_id: string;
  reason: ContentReportReason;
  description?: string;
  status: ReportStatus;
  priority: number;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  // Nested
  recipes?: RecipeSummary;
  reporter?: UserSummary;
  resolved_by_user?: UserSummary;
}

export interface ContentReportDetail extends Omit<ContentReport, "recipes"> {
  recipes?: RecipeDetail;
}

export interface ReportQueueResponse {
  reports: ContentReport[];
  total: number;
}

// =============================================================================
// EXTRACTION FEEDBACK
// =============================================================================

export interface ExtractionFeedback {
  id: string;
  recipe_id: string;
  user_id: string;
  category: ExtractionFeedbackCategory;
  description?: string;
  status: ReportStatus;
  created_at: string;
  resolved_at?: string;
  was_helpful?: boolean;
  // Nested
  recipes?: RecipeSummary;
  user?: UserSummary;
}

export interface FeedbackQueueResponse {
  feedback: ExtractionFeedback[];
  total: number;
}

// =============================================================================
// USER MODERATION
// =============================================================================

export interface UserModeration {
  id: string;
  user_id: string;
  status: UserModerationStatus;
  warning_count: number;
  report_count: number;
  false_report_count: number;
  suspended_until?: string;
  ban_reason?: string;
  reporter_reliability_score: number;
  created_at: string;
  updated_at: string;
}

export interface UserWarning {
  id: string;
  user_id: string;
  issued_by: string;
  reason: string;
  recipe_id?: string;
  acknowledged_at?: string;
  created_at: string;
  // Nested
  issuer?: UserSummary;
  recipes?: RecipeSummary;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  action_type: ModerationActionType;
  reason: string;
  notes?: string;
  duration_days?: number;
  target_user_id?: string;
  target_recipe_id?: string;
  created_at: string;
  // Nested
  moderator?: UserSummary;
  target_user?: UserSummary;
  target_recipe?: RecipeSummary;
}

export interface UserModerationDetail {
  user?: UserSummary;
  moderation: UserModeration;
  warnings: UserWarning[];
  actions: ModerationAction[];
}

// =============================================================================
// USER LIST
// =============================================================================

export interface UserListItem {
  id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string;

  // Moderation status
  moderation_status: UserModerationStatus;
  warning_count: number;
  report_count: number;

  // Reporter stats
  reports_submitted: number;
  false_report_count: number;
  reporter_reliability_score: number;

  // Subscription info
  is_premium: boolean;
  subscription_expires_at?: string;
  is_trial: boolean;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
}

export interface GetUsersParams {
  status?: UserModerationStatus;
  is_premium?: boolean;
  search?: string;
  sort_by?: "created_at" | "name" | "last_sign_in_at";
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// User feedback for detail page
export interface UserFeedback {
  id: string;
  recipe_id: string;
  category: ExtractionFeedbackCategory;
  description?: string;
  status: ReportStatus;
  created_at: string;
  resolved_at?: string;
  was_helpful?: boolean;
  recipes?: RecipeSummary;
}

// Enhanced user detail with feedback and subscription
export interface UserModerationDetailEnhanced extends UserModerationDetail {
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  feedback: UserFeedback[];
  reports_submitted: number;
  is_premium: boolean;
  subscription_product_id?: string;
  subscription_expires_at?: string;
  is_trial: boolean;
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface ReportStatistics {
  by_status: Record<string, number>;
  pending_by_reason: Record<string, number>;
}

export interface FeedbackStatistics {
  by_status: Record<string, number>;
  pending_by_category: Record<string, number>;
}

export interface UserModerationStatistics {
  good_standing: number;
  warned: number;
  suspended: number;
  banned: number;
}

export interface ActionStatistics {
  by_type: Record<string, number>;
  total: number;
  period_days: number;
}

export interface ModerationStatistics {
  reports: ReportStatistics;
  feedback: FeedbackStatistics;
  users: UserModerationStatistics;
  actions: ActionStatistics;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

export interface DismissReportRequest {
  reason: string;
  notes?: string;
  is_false_report?: boolean;
}

export interface TakeActionRequest {
  action: "hide_recipe" | "warn_user" | "suspend_user" | "ban_user";
  reason: string;
  notes?: string;
  suspension_days?: number;
}

export interface ResolveFeedbackRequest {
  resolution_notes?: string;
  was_helpful?: boolean;
}

export interface HideRecipeRequest {
  reason: string;
}

export interface WarnUserRequest {
  reason: string;
  recipe_id?: string;
}

export interface SuspendUserRequest {
  duration_days: number;
  reason: string;
}

export interface BanUserRequest {
  reason: string;
}

// =============================================================================
// HIDDEN RECIPES
// =============================================================================

export interface HiddenRecipe {
  id: string;
  title: string;
  image_url?: string;
  source_url?: string;
  hidden_at?: string;
  hidden_reason?: string;
  created_by?: string;
  owner?: UserSummary;
  hidden_by?: UserSummary;
}

export interface HiddenRecipesResponse {
  recipes: HiddenRecipe[];
  total: number;
}

// =============================================================================
// ADMIN RECIPES LIST
// =============================================================================

export interface AdminRecipeListItem {
  id: string;
  title: string;
  image_url?: string;
  source_type: string;
  source_url?: string;
  is_public: boolean;
  is_draft: boolean;
  is_hidden: boolean;
  created_at: string;
  created_by: string;
  uploader?: UserSummary;
}

export interface AdminRecipesListResponse {
  recipes: AdminRecipeListItem[];
  total: number;
}

export interface GetAdminRecipesParams {
  user_id?: string;
  search?: string;
  is_hidden?: boolean;
  limit?: number;
  offset?: number;
}

export interface AdminRecipeDetail {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  source_type: string;
  source_url?: string;
  is_public: boolean;
  is_draft: boolean;
  is_hidden: boolean;
  hidden_at?: string;
  hidden_reason?: string;
  created_at: string;
  created_by: string;
  ingredients?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  instructions?: Array<{
    step_number: number;
    title?: string;
    description: string;
  }>;
  uploader?: UserSummary;
  hidden_by?: UserSummary;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export interface SendNotificationRequest {
  user_id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  sent_count: number;
  failed_count: number;
}
