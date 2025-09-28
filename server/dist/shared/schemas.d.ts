import { z } from 'zod';
export declare const UsernameSchema: z.ZodString;
export declare const PasswordSchema: z.ZodString;
export declare const EmailSchema: z.ZodOptional<z.ZodString>;
export declare const InviteCodeSchema: z.ZodString;
export declare const AccountSchema: z.ZodObject<{
    pub: z.ZodOptional<z.ZodString>;
    epub: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodAny>;
    validate: z.ZodOptional<z.ZodAny>;
    reset: z.ZodOptional<z.ZodAny>;
    expiry: z.ZodOptional<z.ZodNumber>;
    subscribed: z.ZodDefault<z.ZodNumber>;
    feeds: z.ZodDefault<z.ZodNumber>;
    ref: z.ZodOptional<z.ZodString>;
    host: z.ZodOptional<z.ZodString>;
    prev: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Account = z.infer<typeof AccountSchema>;
export declare const FeedSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    description: z.ZodDefault<z.ZodString>;
    html_url: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    image: z.ZodDefault<z.ZodString>;
    subscriber_count: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type Feed = z.infer<typeof FeedSchema>;
export declare const FeedDataSchema: z.ZodObject<{
    add: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        html_url: z.ZodOptional<z.ZodString>;
        language: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FeedData = z.infer<typeof FeedDataSchema>;
export declare const ItemDataSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    content: z.ZodDefault<z.ZodString>;
    author: z.ZodDefault<z.ZodString>;
    permalink: z.ZodDefault<z.ZodString>;
    guid: z.ZodString;
    timestamp: z.ZodNumber;
    url: z.ZodString;
    enclosure: z.ZodOptional<z.ZodAny>;
    category: z.ZodOptional<z.ZodAny>;
}, z.core.$strip>;
export type ItemData = z.infer<typeof ItemDataSchema>;
export declare const RemoveItemSchema: z.ZodObject<{
    guid: z.ZodString;
    url: z.ZodString;
}, z.core.$strip>;
export type RemoveItem = z.infer<typeof RemoveItemSchema>;
export declare const InviteCodeDataSchema: z.ZodObject<{
    code: z.ZodString;
    owner: z.ZodString;
    key: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InviteCode = z.infer<typeof InviteCodeDataSchema>;
export declare const RegisterRequestSchema: z.ZodObject<{
    code: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export declare const CheckInviteCodeRequestSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CheckInviteCodeRequest = z.infer<typeof CheckInviteCodeRequestSchema>;
export declare const ClaimInviteCodeRequestSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    pub: z.ZodString;
    epub: z.ZodString;
    username: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ClaimInviteCodeRequest = z.infer<typeof ClaimInviteCodeRequestSchema>;
export declare const ValidateEmailRequestSchema: z.ZodObject<{
    code: z.ZodString;
    validate: z.ZodString;
}, z.core.$strip>;
export type ValidateEmailRequest = z.infer<typeof ValidateEmailRequestSchema>;
export declare const ResetPasswordRequestSchema: z.ZodObject<{
    code: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export declare const UpdatePasswordRequestSchema: z.ZodObject<{
    code: z.ZodString;
    reset: z.ZodString;
    pub: z.ZodString;
    epub: z.ZodString;
    username: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;
export declare const AddFeedRequestSchema: z.ZodObject<{
    code: z.ZodString;
    url: z.ZodString;
}, z.core.$strip>;
export type AddFeedRequest = z.infer<typeof AddFeedRequestSchema>;
export declare const SubscriberRequestSchema: z.ZodObject<{
    code: z.ZodString;
    url: z.ZodString;
}, z.core.$strip>;
export type SubscriberRequest = z.infer<typeof SubscriberRequestSchema>;
export declare const CreateInviteCodesRequestSchema: z.ZodObject<{
    code: z.ZodString;
    count: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type CreateInviteCodesRequest = z.infer<typeof CreateInviteCodesRequestSchema>;
export declare const SendInviteCodeRequestSchema: z.ZodObject<{
    code: z.ZodString;
    email: z.ZodString;
}, z.core.$strip>;
export type SendInviteCodeRequest = z.infer<typeof SendInviteCodeRequestSchema>;
export declare const UpdateFeedLimitRequestSchema: z.ZodObject<{
    code: z.ZodString;
    limit: z.ZodNumber;
}, z.core.$strip>;
export type UpdateFeedLimitRequest = z.infer<typeof UpdateFeedLimitRequestSchema>;
export declare const RemoveFeedRequestSchema: z.ZodObject<{
    url: z.ZodString;
}, z.core.$strip>;
export type RemoveFeedRequest = z.infer<typeof RemoveFeedRequestSchema>;
export declare const AddItemRequestSchema: z.ZodObject<{
    url: z.ZodString;
    guid: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    permalink: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
    enclosure: z.ZodOptional<z.ZodAny>;
    category: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type AddItemRequest = z.infer<typeof AddItemRequestSchema>;
export declare const validateRequest: <T>(schema: z.ZodSchema<T>, data: unknown) => {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
export declare const validatePartial: <T extends z.ZodRawShape>(shape: T, data: unknown) => {
    success: true;
    data: any;
} | {
    success: false;
    error: string;
};
//# sourceMappingURL=schemas.d.ts.map