import { z } from 'zod';

// ============= Base Schemas =============

// User credentials
export const UsernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(/^\w+$/, 'Username must contain only letters, numbers, and underscores');

export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password cannot exceed 100 characters');

export const EmailSchema = z.string().email('Invalid email address').optional();

export const InviteCodeSchema = z.string()
  .min(1, 'Invite code is required')
  .max(50, 'Invite code is too long');

// ============= Account Schemas =============

export const AccountSchema = z.object({
  pub: z.string().optional(),
  epub: z.string().optional(),
  username: z.string().optional(),
  name: z.string().optional(),
  email: z.any().optional(), // Encrypted
  validate: z.any().optional(), // Encrypted
  reset: z.any().optional(), // Encrypted
  expiry: z.number().optional(),
  subscribed: z.number().default(0),
  feeds: z.number().default(10),
  ref: z.string().optional(),
  host: z.string().optional(),
  prev: z.string().optional(),
});

export type Account = z.infer<typeof AccountSchema>;

// ============= Feed Schemas =============

export const FeedSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  html_url: z.string().default(''),
  language: z.string().default(''),
  image: z.string().default(''),
  subscriber_count: z.number().default(0),
});

export type Feed = z.infer<typeof FeedSchema>;

export const FeedDataSchema = z.object({
  add: z.object({
    url: z.string(),
    title: z.string(),
    description: z.string().optional(),
    html_url: z.string().optional(),
    language: z.string().optional(),
    image: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
});

export type FeedData = z.infer<typeof FeedDataSchema>;

// ============= Item Schemas =============

export const ItemDataSchema = z.object({
  title: z.string().default(''),
  content: z.string().default(''),
  author: z.string().default(''),
  permalink: z.string().default(''),
  guid: z.string(),
  timestamp: z.number(),
  url: z.string(),
  enclosure: z.any().optional(),
  category: z.any().optional(),
});

export type ItemData = z.infer<typeof ItemDataSchema>;

export const RemoveItemSchema = z.object({
  guid: z.string(),
  url: z.string(),
});

export type RemoveItem = z.infer<typeof RemoveItemSchema>;

// ============= Invite Code Schemas =============

export const InviteCodeDataSchema = z.object({
  code: z.string(),
  owner: z.string(),
  key: z.string().optional(),
});

export type InviteCode = z.infer<typeof InviteCodeDataSchema>;

// ============= API Request Schemas =============

// Registration
export const RegisterRequestSchema = z.object({
  code: InviteCodeSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  email: EmailSchema,
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// Check invite code
export const CheckInviteCodeRequestSchema = z.object({
  code: InviteCodeSchema.optional(),
});

export type CheckInviteCodeRequest = z.infer<typeof CheckInviteCodeRequestSchema>;

// Claim invite code
export const ClaimInviteCodeRequestSchema = z.object({
  code: InviteCodeSchema.optional(),
  pub: z.string(),
  epub: z.string(),
  username: UsernameSchema,
  email: EmailSchema,
});

export type ClaimInviteCodeRequest = z.infer<typeof ClaimInviteCodeRequestSchema>;

// Validate email
export const ValidateEmailRequestSchema = z.object({
  code: InviteCodeSchema,
  validate: z.string(),
});

export type ValidateEmailRequest = z.infer<typeof ValidateEmailRequestSchema>;

// Reset password
export const ResetPasswordRequestSchema = z.object({
  code: InviteCodeSchema,
  email: EmailSchema.refine((val: string | undefined) => val !== undefined, { message: 'Email is required for password reset' }),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// Update password
export const UpdatePasswordRequestSchema = z.object({
  code: InviteCodeSchema,
  reset: z.string(),
  pub: z.string(),
  epub: z.string(),
  username: UsernameSchema,
  name: z.string().min(1, 'Display name is required'),
});

export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;

// Add feed
export const AddFeedRequestSchema = z.object({
  code: InviteCodeSchema,
  url: z.string().url('Invalid URL'),
});

export type AddFeedRequest = z.infer<typeof AddFeedRequestSchema>;

// Add/Remove subscriber
export const SubscriberRequestSchema = z.object({
  code: InviteCodeSchema,
  url: z.string(),
});

export type SubscriberRequest = z.infer<typeof SubscriberRequestSchema>;

// Private endpoints
export const CreateInviteCodesRequestSchema = z.object({
  code: InviteCodeSchema,
  count: z.number().min(1).max(100).default(1),
});

export type CreateInviteCodesRequest = z.infer<typeof CreateInviteCodesRequestSchema>;

export const SendInviteCodeRequestSchema = z.object({
  code: InviteCodeSchema,
  email: z.string().email('Invalid email address'),
});

export type SendInviteCodeRequest = z.infer<typeof SendInviteCodeRequestSchema>;

export const UpdateFeedLimitRequestSchema = z.object({
  code: InviteCodeSchema,
  limit: z.number().min(1).max(1000),
});

export type UpdateFeedLimitRequest = z.infer<typeof UpdateFeedLimitRequestSchema>;

export const RemoveFeedRequestSchema = z.object({
  url: z.string().url('Invalid URL'),
});

export type RemoveFeedRequest = z.infer<typeof RemoveFeedRequestSchema>;

export const AddItemRequestSchema = z.object({
  url: z.string(),
  guid: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  author: z.string().optional(),
  permalink: z.string().optional(),
  timestamp: z.number(),
  enclosure: z.any().optional(),
  category: z.array(z.string()).optional(),
});

export type AddItemRequest = z.infer<typeof AddItemRequestSchema>;

// ============= Validation Helpers =============

export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation error' };
  }
};

export const validatePartial = <T extends z.ZodRawShape>(shape: T, data: unknown): { success: true; data: any } | { success: false; error: string } => {
  try {
    const schema = z.object(shape);
    const partialSchema = schema.partial();
    const result = partialSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation error' };
  }
};