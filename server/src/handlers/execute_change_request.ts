
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequestActionInput, type ItilApiResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const executeChangeRequest = async (input: ChangeRequestActionInput): Promise<ItilApiResponse> => {
  try {
    // Verify change request exists and is in approved status
    const changeRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, input.id))
      .execute();

    if (changeRequests.length === 0) {
      return {
        success: false,
        message: 'Change request not found'
      };
    }

    const changeRequest = changeRequests[0];

    // Verify change request is in approved status
    if (changeRequest.status !== 'approved') {
      return {
        success: false,
        message: `Cannot execute change request with status: ${changeRequest.status}. Must be approved.`
      };
    }

    // Update change request status to 'in_progress' and set actual_start timestamp
    const now = new Date();
    await db.update(changeRequestsTable)
      .set({
        status: 'in_progress',
        actual_start: now,
        updated_at: now
      })
      .where(eq(changeRequestsTable.id, input.id))
      .execute();

    // Simulate ITIL2 API execution command
    // In real implementation, this would be an actual API call
    console.log(`Sending execution command to ITIL2 API for change request ${input.id}`);
    
    return {
      success: true,
      message: 'Change request execution initiated',
      data: { 
        changeId: input.id, 
        executionStatus: 'started',
        actualStart: now.toISOString()
      }
    };
  } catch (error) {
    console.error('Change request execution failed:', error);
    throw error;
  }
};
