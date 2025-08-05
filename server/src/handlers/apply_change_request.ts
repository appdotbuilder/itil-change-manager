
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequestActionInput, type ItilApiResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const applyChangeRequest = async (input: ChangeRequestActionInput): Promise<ItilApiResponse> => {
  try {
    // First, fetch the change request to ensure it exists
    const existingRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, input.id))
      .execute();

    if (existingRequests.length === 0) {
      return {
        success: false,
        message: `Change request with ID ${input.id} not found`
      };
    }

    const changeRequest = existingRequests[0];

    // Check if the change request is in a valid state to be applied
    if (changeRequest.status !== 'draft') {
      return {
        success: false,
        message: `Change request cannot be applied. Current status: ${changeRequest.status}`
      };
    }

    // Prepare data for ITIL API
    const itilPayload = {
      id: changeRequest.id,
      title: changeRequest.title,
      description: changeRequest.description,
      change_type: changeRequest.change_type,
      priority: changeRequest.priority,
      requester_name: changeRequest.requester_name,
      requester_email: changeRequest.requester_email,
      business_justification: changeRequest.business_justification,
      implementation_plan: changeRequest.implementation_plan,
      rollback_plan: changeRequest.rollback_plan,
      risk_assessment: changeRequest.risk_assessment,
      impact_assessment: changeRequest.impact_assessment,
      scheduled_start: changeRequest.scheduled_start,
      scheduled_end: changeRequest.scheduled_end,
      notes: input.notes
    };

    // Simulate ITIL API call (in real implementation, this would be an actual HTTP request)
    // For now, we'll assume the API call is successful
    const apiSuccess = true;

    if (apiSuccess) {
      // Update the change request status to 'submitted'
      await db.update(changeRequestsTable)
        .set({
          status: 'submitted',
          updated_at: new Date()
        })
        .where(eq(changeRequestsTable.id, input.id))
        .execute();

      return {
        success: true,
        message: 'Change request applied successfully',
        data: {
          changeId: input.id,
          newStatus: 'submitted',
          itilPayload
        }
      };
    } else {
      return {
        success: false,
        message: 'Failed to submit change request to ITIL API'
      };
    }
  } catch (error) {
    console.error('Apply change request failed:', error);
    throw error;
  }
};
