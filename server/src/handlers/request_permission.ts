
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequestActionInput, type ItilApiResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const requestPermission = async (input: ChangeRequestActionInput): Promise<ItilApiResponse> => {
  try {
    // First, verify the change request exists
    const changeRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, input.id))
      .execute();

    if (changeRequests.length === 0) {
      return {
        success: false,
        message: `Change request with ID ${input.id} not found`
      };
    }

    const changeRequest = changeRequests[0];

    // Check if change request is in a valid state for permission request
    const validStatuses = ['draft', 'submitted'];
    if (!validStatuses.includes(changeRequest.status)) {
      return {
        success: false,
        message: `Cannot request permission for change request with status: ${changeRequest.status}. Valid statuses are: ${validStatuses.join(', ')}`
      };
    }

    // Update status to 'submitted' if currently 'draft'
    if (changeRequest.status === 'draft') {
      await db.update(changeRequestsTable)
        .set({ 
          status: 'submitted',
          updated_at: new Date()
        })
        .where(eq(changeRequestsTable.id, input.id))
        .execute();
    }

    // Simulate ITIL2 API integration
    // In real implementation, this would make an HTTP request to ITIL2 API
    const permissionRequestData = {
      changeId: input.id,
      title: changeRequest.title,
      changeType: changeRequest.change_type,
      priority: changeRequest.priority,
      requesterEmail: changeRequest.requester_email,
      businessJustification: changeRequest.business_justification,
      riskAssessment: changeRequest.risk_assessment,
      notes: input.notes
    };

    return {
      success: true,
      message: 'Permission request sent successfully',
      data: { 
        changeId: input.id, 
        permissionStatus: 'pending',
        requestData: permissionRequestData
      }
    };

  } catch (error) {
    console.error('Permission request failed:', error);
    throw error;
  }
};
