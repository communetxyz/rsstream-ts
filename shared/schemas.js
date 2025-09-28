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
// ============= Feed Schemas =============
export const FeedSchema = z.object({
    title: z.string().default(''),
    description: z.string().default(''),
    html_url: z.string().default(''),
    language: z.string().default(''),
    image: z.string().default(''),
    subscriber_count: z.number().default(0),
});
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
export const RemoveItemSchema = z.object({
    guid: z.string(),
    url: z.string(),
});
// ============= Invite Code Schemas =============
export const InviteCodeDataSchema = z.object({
    code: z.string(),
    owner: z.string(),
    key: z.string().optional(),
});
// ============= API Request Schemas =============
// Registration
export const RegisterRequestSchema = z.object({
    code: InviteCodeSchema,
    username: UsernameSchema,
    password: PasswordSchema,
    email: EmailSchema,
});
// Check invite code
export const CheckInviteCodeRequestSchema = z.object({
    code: InviteCodeSchema.optional(),
});
// Claim invite code
export const ClaimInviteCodeRequestSchema = z.object({
    code: InviteCodeSchema.optional(),
    pub: z.string(),
    epub: z.string(),
    username: UsernameSchema,
    email: EmailSchema,
});
// Validate email
export const ValidateEmailRequestSchema = z.object({
    code: InviteCodeSchema,
    validate: z.string(),
});
// Reset password
export const ResetPasswordRequestSchema = z.object({
    code: InviteCodeSchema,
    email: EmailSchema.refine(val => val !== undefined, { message: 'Email is required for password reset' }),
});
// Update password
export const UpdatePasswordRequestSchema = z.object({
    code: InviteCodeSchema,
    reset: z.string(),
    pub: z.string(),
    epub: z.string(),
    username: UsernameSchema,
    name: z.string().min(1, 'Display name is required'),
});
// Add feed
export const AddFeedRequestSchema = z.object({
    code: InviteCodeSchema,
    url: z.string().url('Invalid URL'),
});
// Add/Remove subscriber
export const SubscriberRequestSchema = z.object({
    code: InviteCodeSchema,
    url: z.string(),
});
// Private endpoints
export const CreateInviteCodesRequestSchema = z.object({
    code: InviteCodeSchema,
    count: z.number().min(1).max(100).default(1),
});
export const SendInviteCodeRequestSchema = z.object({
    code: InviteCodeSchema,
    email: z.string().email('Invalid email address'),
});
export const UpdateFeedLimitRequestSchema = z.object({
    code: InviteCodeSchema,
    limit: z.number().min(1).max(1000),
});
export const RemoveFeedRequestSchema = z.object({
    url: z.string().url('Invalid URL'),
});
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
// ============= Validation Helpers =============
export const validateRequest = (schema, data) => {
    try {
        const result = schema.parse(data);
        return { success: true, data: result };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: messages };
        }
        return { success: false, error: 'Validation error' };
    }
};
export const validatePartial = (schema, data) => {
    try {
        const partialSchema = schema.partial();
        const result = partialSchema.parse(data);
        return { success: true, data: result };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: messages };
        }
        return { success: false, error: 'Validation error' };
    }
};
//# sourceMappingURL=schemas.js.map