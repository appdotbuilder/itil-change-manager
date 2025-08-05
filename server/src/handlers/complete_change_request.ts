
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequestActionInput, type ItilApiResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const completeChangeRequest = async (input: ChangeRequestActionInput): Promise<ItilApiResponse> => {
  try {
    // First, verify the change request exists and is in a valid state for completion
    const existingRequest = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, input.id))
      .execute();

    if (existingRequest.length === 0) {
      return {
        success: false,
        message: `Change request with ID ${input.id} not found`
      };
    }

    const changeRequest = existingRequest[0];

    // Validate that the change request can be completed
    const validStatusesForCompletion = ['in_progress', 'scheduled'];
    if (!validStatusesForCompletion.includes(changeRequest.status)) {
      return {
        success: false,
        message: `Change request cannot be completed from status '${changeRequest.status}'. Must be 'in_progress' or 'scheduled'.`
      };
    }

    // Update the change request to completed status
    const now = new Date();
    const result = await db.update(changeRequestsTable)
      .set({
        status: 'completed',
        actual_end: now,
        updated_at: now
      })
      .where(eq(changeRequestsTable.id, input.id))
      .returning()
      .execute();

    const updatedRequest = result[0];

    return {
      success: true,
      message: 'Change request marked as completed',
      data: {
        changeId: updatedRequest.id,
        completionStatus: 'done',
        completedAt: updatedRequest.actual_end,
        title: updatedRequest.title,
        status: updatedRequest.status
      }
    };
  } catch (error) {
    console.error('Change request completion failed:', error);
    throw error;
  }
};
