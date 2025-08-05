
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequestActionInput, type CreateChangeRequestInput } from '../schema';
import { applyChangeRequest } from '../handlers/apply_change_request';
import { eq } from 'drizzle-orm';

// Test input for creating a change request directly in database
const testCreateInput: CreateChangeRequestInput = {
  title: 'Test Change Request',
  description: 'A test change request for applying',
  change_type: 'normal',
  priority: 'medium',
  requester_name: 'John Doe',
  requester_email: 'john.doe@example.com',
  business_justification: 'Business needs this change',
  implementation_plan: 'Step 1: Do this, Step 2: Do that',
  rollback_plan: 'Revert changes if needed',
  risk_assessment: 'Low risk',
  impact_assessment: 'Medium impact'
};

describe('applyChangeRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a change request directly in database
  const createTestChangeRequest = async (input: CreateChangeRequestInput) => {
    const result = await db.insert(changeRequestsTable)
      .values({
        title: input.title,
        description: input.description,
        change_type: input.change_type,
        priority: input.priority,
        requester_name: input.requester_name,
        requester_email: input.requester_email,
        business_justification: input.business_justification,
        implementation_plan: input.implementation_plan,
        rollback_plan: input.rollback_plan,
        risk_assessment: input.risk_assessment || null,
        impact_assessment: input.impact_assessment || null,
        scheduled_start: input.scheduled_start || null,
        scheduled_end: input.scheduled_end || null,
        status: 'draft'
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should apply a change request successfully', async () => {
    // Create a change request first
    const createdRequest = await createTestChangeRequest(testCreateInput);

    const actionInput: ChangeRequestActionInput = {
      id: createdRequest.id,
      action: 'apply',
      notes: 'Applying this change request'
    };

    const result = await applyChangeRequest(actionInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual('Change request applied successfully');
    expect(result.data).toBeDefined();
    expect(result.data.changeId).toEqual(createdRequest.id);
    expect(result.data.newStatus).toEqual('submitted');
    expect(result.data.itilPayload).toBeDefined();
    expect(result.data.itilPayload.notes).toEqual('Applying this change request');
  });

  it('should update change request status to submitted', async () => {
    // Create a change request first
    const createdRequest = await createTestChangeRequest(testCreateInput);

    const actionInput: ChangeRequestActionInput = {
      id: createdRequest.id,
      action: 'apply'
    };

    await applyChangeRequest(actionInput);

    // Verify the status was updated in the database
    const updatedRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, createdRequest.id))
      .execute();

    expect(updatedRequests).toHaveLength(1);
    expect(updatedRequests[0].status).toEqual('submitted');
    expect(updatedRequests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return error for non-existent change request', async () => {
    const actionInput: ChangeRequestActionInput = {
      id: 99999,
      action: 'apply'
    };

    const result = await applyChangeRequest(actionInput);

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Change request with ID 99999 not found');
  });

  it('should return error when change request is not in draft status', async () => {
    // Create a change request first
    const createdRequest = await createTestChangeRequest(testCreateInput);

    // Manually update status to something other than draft
    await db.update(changeRequestsTable)
      .set({ status: 'approved' })
      .where(eq(changeRequestsTable.id, createdRequest.id))
      .execute();

    const actionInput: ChangeRequestActionInput = {
      id: createdRequest.id,
      action: 'apply'
    };

    const result = await applyChangeRequest(actionInput);

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Change request cannot be applied. Current status: approved');
  });

  it('should include all required fields in ITIL payload', async () => {
    // Create a change request with all fields
    const fullInput: CreateChangeRequestInput = {
      ...testCreateInput,
      scheduled_start: new Date('2024-01-15T10:00:00Z'),
      scheduled_end: new Date('2024-01-15T12:00:00Z')
    };

    const createdRequest = await createTestChangeRequest(fullInput);

    const actionInput: ChangeRequestActionInput = {
      id: createdRequest.id,
      action: 'apply',
      notes: 'Test notes'
    };

    const result = await applyChangeRequest(actionInput);

    expect(result.success).toBe(true);
    expect(result.data.itilPayload).toMatchObject({
      id: createdRequest.id,
      title: 'Test Change Request',
      description: 'A test change request for applying',
      change_type: 'normal',
      priority: 'medium',
      requester_name: 'John Doe',
      requester_email: 'john.doe@example.com',
      business_justification: 'Business needs this change',
      implementation_plan: 'Step 1: Do this, Step 2: Do that',
      rollback_plan: 'Revert changes if needed',
      risk_assessment: 'Low risk',
      impact_assessment: 'Medium impact',
      notes: 'Test notes'
    });
    expect(result.data.itilPayload.scheduled_start).toBeInstanceOf(Date);
    expect(result.data.itilPayload.scheduled_end).toBeInstanceOf(Date);
  });

  it('should handle change request without optional fields', async () => {
    // Create a change request with minimal fields
    const minimalInput: CreateChangeRequestInput = {
      title: 'Minimal Change Request',
      description: 'Minimal description',
      change_type: 'standard',
      priority: 'low',
      requester_name: 'Jane Doe',
      requester_email: 'jane.doe@example.com',
      business_justification: 'Minimal justification',
      implementation_plan: 'Minimal plan',
      rollback_plan: 'Minimal rollback'
    };

    const createdRequest = await createTestChangeRequest(minimalInput);

    const actionInput: ChangeRequestActionInput = {
      id: createdRequest.id,
      action: 'apply'
    };

    const result = await applyChangeRequest(actionInput);

    expect(result.success).toBe(true);
    expect(result.data.itilPayload.risk_assessment).toBeNull();
    expect(result.data.itilPayload.impact_assessment).toBeNull();
    expect(result.data.itilPayload.scheduled_start).toBeNull();
    expect(result.data.itilPayload.scheduled_end).toBeNull();
    expect(result.data.itilPayload.notes).toBeUndefined();
  });
});
