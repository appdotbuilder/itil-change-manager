
import { z } from 'zod';

// ITIL Change Request Status Enum
export const changeStatusSchema = z.enum([
  'draft',
  'submitted',
  'approved',
  'rejected',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
]);

export type ChangeStatus = z.infer<typeof changeStatusSchema>;

// ITIL Change Request Priority Enum
export const changePrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical'
]);

export type ChangePriority = z.infer<typeof changePrioritySchema>;

// ITIL Change Request Type Enum
export const changeTypeSchema = z.enum([
  'standard',
  'normal',
  'emergency'
]);

export type ChangeType = z.infer<typeof changeTypeSchema>;

// Change Request schema
export const changeRequestSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  change_type: changeTypeSchema,
  priority: changePrioritySchema,
  status: changeStatusSchema,
  requester_name: z.string(),
  requester_email: z.string().email(),
  business_justification: z.string(),
  implementation_plan: z.string(),
  rollback_plan: z.string(),
  risk_assessment: z.string().nullable(),
  impact_assessment: z.string().nullable(),
  scheduled_start: z.coerce.date().nullable(),
  scheduled_end: z.coerce.date().nullable(),
  actual_start: z.coerce.date().nullable(),
  actual_end: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ChangeRequest = z.infer<typeof changeRequestSchema>;

// Input schema for creating change requests
export const createChangeRequestInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  change_type: changeTypeSchema,
  priority: changePrioritySchema,
  requester_name: z.string().min(1, 'Requester name is required'),
  requester_email: z.string().email('Valid email is required'),
  business_justification: z.string().min(1, 'Business justification is required'),
  implementation_plan: z.string().min(1, 'Implementation plan is required'),
  rollback_plan: z.string().min(1, 'Rollback plan is required'),
  risk_assessment: z.string().nullable().optional(),
  impact_assessment: z.string().nullable().optional(),
  scheduled_start: z.coerce.date().nullable().optional(),
  scheduled_end: z.coerce.date().nullable().optional()
});

export type CreateChangeRequestInput = z.infer<typeof createChangeRequestInputSchema>;

// Input schema for updating change requests
export const updateChangeRequestInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  change_type: changeTypeSchema.optional(),
  priority: changePrioritySchema.optional(),
  requester_name: z.string().min(1).optional(),
  requester_email: z.string().email().optional(),
  business_justification: z.string().min(1).optional(),
  implementation_plan: z.string().min(1).optional(),
  rollback_plan: z.string().min(1).optional(),
  risk_assessment: z.string().nullable().optional(),
  impact_assessment: z.string().nullable().optional(),
  scheduled_start: z.coerce.date().nullable().optional(),
  scheduled_end: z.coerce.date().nullable().optional()
});

export type UpdateChangeRequestInput = z.infer<typeof updateChangeRequestInputSchema>;

// Schema for change request actions
export const changeRequestActionInputSchema = z.object({
  id: z.number(),
  action: z.enum(['apply', 'request_permission', 'execute', 'done']),
  notes: z.string().optional()
});

export type ChangeRequestActionInput = z.infer<typeof changeRequestActionInputSchema>;

// API Response schemas for ITIL integration
export const itilApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional()
});

export type ItilApiResponse = z.infer<typeof itilApiResponseSchema>;
