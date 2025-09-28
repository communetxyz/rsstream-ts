import { z } from 'zod';
export declare const UsernameSchema: any;
export declare const PasswordSchema: any;
export declare const EmailSchema: any;
export declare const InviteCodeSchema: any;
export declare const AccountSchema: any;
export type Account = z.infer<typeof AccountSchema>;
export declare const FeedSchema: any;
export type Feed = z.infer<typeof FeedSchema>;
export declare const FeedDataSchema: any;
export type FeedData = z.infer<typeof FeedDataSchema>;
export declare const ItemDataSchema: any;
export type ItemData = z.infer<typeof ItemDataSchema>;
export declare const RemoveItemSchema: any;
export type RemoveItem = z.infer<typeof RemoveItemSchema>;
export declare const InviteCodeDataSchema: any;
export type InviteCode = z.infer<typeof InviteCodeDataSchema>;
export declare const RegisterRequestSchema: any;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export declare const CheckInviteCodeRequestSchema: any;
export type CheckInviteCodeRequest = z.infer<typeof CheckInviteCodeRequestSchema>;
export declare const ClaimInviteCodeRequestSchema: any;
export type ClaimInviteCodeRequest = z.infer<typeof ClaimInviteCodeRequestSchema>;
export declare const ValidateEmailRequestSchema: any;
export type ValidateEmailRequest = z.infer<typeof ValidateEmailRequestSchema>;
export declare const ResetPasswordRequestSchema: any;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export declare const UpdatePasswordRequestSchema: any;
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;
export declare const AddFeedRequestSchema: any;
export type AddFeedRequest = z.infer<typeof AddFeedRequestSchema>;
export declare const SubscriberRequestSchema: any;
export type SubscriberRequest = z.infer<typeof SubscriberRequestSchema>;
export declare const CreateInviteCodesRequestSchema: any;
export type CreateInviteCodesRequest = z.infer<typeof CreateInviteCodesRequestSchema>;
export declare const SendInviteCodeRequestSchema: any;
export type SendInviteCodeRequest = z.infer<typeof SendInviteCodeRequestSchema>;
export declare const UpdateFeedLimitRequestSchema: any;
export type UpdateFeedLimitRequest = z.infer<typeof UpdateFeedLimitRequestSchema>;
export declare const RemoveFeedRequestSchema: any;
export type RemoveFeedRequest = z.infer<typeof RemoveFeedRequestSchema>;
export declare const AddItemRequestSchema: any;
export type AddItemRequest = z.infer<typeof AddItemRequestSchema>;
export declare const validateRequest: <T>(schema: z.ZodSchema<T>, data: unknown) => {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
export declare const validatePartial: <T>(schema: z.ZodSchema<T>, data: unknown) => {
    success: true;
    data: Partial<T>;
} | {
    success: false;
    error: string;
};
//# sourceMappingURL=schemas.d.ts.map