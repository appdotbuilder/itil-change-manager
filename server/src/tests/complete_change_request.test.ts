
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequestActionInput } from '../schema';
import { completeChangeRequest } from '../handlers/complete_change_request';
import { eq } from 'drizzle-orm';

// Test input for action
const testActionInput: ChangeRequestActionInput = {
  id: 1,
  action: 'done',
  notes: 'Change completed successfully'
};

describe('completeChangeRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should complete a change request that is in progress', async () => {
    // Create a change request in 'in_progress' status
    await db.insert(changeRequestsTable).values({
      title: 'Test Change Request',
      description: 'A test change request',
      change_type: 'normal',
      priority: 'medium',
      status: 'in_progress',
      requester_name: 'John Doe',
      requester_email: 'john@example.com',
      business_justification: 'Business needs this change',
      implementation_plan: 'Step by step plan',
      rollback_plan: 'Rollback procedure',
      actual_start: new Date()
    }).execute();

    const result = await completeChangeRequest(testActionInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual('Change request marked as completed');
    expect(result.data).toBeDefined();
    expect(result.data.changeId).toEqual(1);
    expect(result.data.completionStatus).toEqual('done');
    expect(result.data.status).toEqual('completed');
    expect(result.data.completedAt).toBeInstanceOf(Date);
  });

  it('should complete a change request that is scheduled', async () => {
    // Create a change request in 'scheduled' status
    await db.insert(changeRequestsTable).values({
      title: 'Scheduled Change Request',
      description: 'A scheduled change request',
      change_type: 'standard',
      priority: 'low',
      status: 'scheduled',
      requester_name: 'Jane Smith',
      requester_email: 'jane@example.com',
      business_justification: 'Scheduled maintenance',
      implementation_plan: 'Maintenance plan',
      rollback_plan: 'Rollback if needed',
      scheduled_start: new Date(),
      scheduled_end: new Date()
    }).execute();

    const result = await completeChangeRequest(testActionInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual('Change request marked as completed');
    expect(result.data.status).toEqual('completed');
  });

  it('should update the database with completed status and actual_end timestamp', async () => {
    // Create a change request in 'in_progress' status
    await db.insert(changeRequestsTable).values({
      title: 'Test Change Request',
      description: 'A test change request',
      change_type: 'normal',
      priority: 'medium',
      status: 'in_progress',
      requester_name: 'John Doe',
      requester_email: 'john@example.com',
      business_justification: 'Business needs this change',
      implementation_plan: 'Step by step plan',
      rollback_plan: 'Rollback procedure'
    }).execute();

    const beforeCompletion = new Date();
    await completeChangeRequest(testActionInput);

    // Verify database was updated
    const updatedRequest = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, 1))
      .execute();

    expect(updatedRequest).toHaveLength(1);
    expect(updatedRequest[0].status).toEqual('completed');
    expect(updatedRequest[0].actual_end).toBeInstanceOf(Date);
    expect(updatedRequest[0].actual_end!.getTime()).toBeGreaterThanOrEqual(beforeCompletion.getTime());
    expect(updatedRequest[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return error when change request does not exist', async () => {
    const result = await completeChangeRequest({
      id: 999,
      action: 'done'
    });

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Change request with ID 999 not found');
    expect(result.data).toBeUndefined();
  });

  it('should return error when change request is in invalid status', async () => {
    // Create a change request in 'draft' status (invalid for completion)
    await db.insert(changeRequestsTable).values({
      title: 'Draft Change Request',
      description: 'A draft change request',
      change_type: 'normal',
      priority: 'medium',
      status: 'draft',
      requester_name: 'John Doe',
      requester_email: 'john@example.com',
      business_justification: 'Business needs this change',
      implementation_plan: 'Step by step plan',
      rollback_plan: 'Rollback procedure'
    }).execute();

    const result = await completeChangeRequest(testActionInput);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/cannot be completed from status 'draft'/);
  });

  it('should return error when change request is already completed', async () => {
    // Create a change request that is already completed
    await db.insert(changeRequestsTable).values({
      title: 'Completed Change Request',
      description: 'An already completed change request',
      change_type: 'normal',
      priority: 'medium',
      status: 'completed',
      requester_name: 'John Doe',
      requester_email: 'john@example.com',
      business_justification: 'Business needs this change',
      implementation_plan: 'Step by step plan',
      rollback_plan: 'Rollback procedure',
      actual_end: new Date()
    }).execute();

    const result = await completeChangeRequest(testActionInput);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/cannot be completed from status 'completed'/);
  });
});
