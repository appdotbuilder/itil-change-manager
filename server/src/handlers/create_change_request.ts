
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type CreateChangeRequestInput, type ChangeRequest } from '../schema';

export const createChangeRequest = async (input: CreateChangeRequestInput): Promise<ChangeRequest> => {
  try {
    // Insert change request record
    const result = await db.insert(changeRequestsTable)
      .values({
        title: input.title,
        description: input.description,
        change_type: input.change_type,
        priority: input.priority,
        status: 'draft', // Default status for new change requests
        requester_name: input.requester_name,
        requester_email: input.requester_email,
        business_justification: input.business_justification,
        implementation_plan: input.implementation_plan,
        rollback_plan: input.rollback_plan,
        risk_assessment: input.risk_assessment || null,
        impact_assessment: input.impact_assessment || null,
        scheduled_start: input.scheduled_start || null,
        scheduled_end: input.scheduled_end || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Change request creation failed:', error);
    throw error;
  }
};
