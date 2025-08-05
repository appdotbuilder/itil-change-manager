
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequestActionInput } from '../schema';
import { executeChangeRequest } from '../handlers/execute_change_request';
import { eq } from 'drizzle-orm';

// Test input for executing change request
const testInput: ChangeRequestActionInput = {
  id: 1,
  action: 'execute',
  notes: 'Starting execution of change request'
};

describe('executeChangeRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should execute an approved change request', async () => {
    // Create an approved change request first
    await db.insert(changeRequestsTable)
      .values({
        title: 'Test Change',
        description: 'Test change description',
        change_type: 'normal',
        priority: 'medium',
        status: 'approved',
        requester_name: 'John Doe',
        requester_email: 'john@example.com',
        business_justification: 'Business need',
        implementation_plan: 'Implementation steps',
        rollback_plan: 'Rollback steps'
      })
      .execute();

    const result = await executeChangeRequest(testInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual('Change request execution initiated');
    expect(result.data).toBeDefined();
    expect(result.data.changeId).toEqual(1);
    expect(result.data.executionStatus).toEqual('started');
    expect(result.data.actualStart).toBeDefined();
  });

  it('should update change request status to in_progress', async () => {
    // Create an approved change request
    await db.insert(changeRequestsTable)
      .values({
        title: 'Test Change',
        description: 'Test change description',
        change_type: 'normal',
        priority: 'medium',
        status: 'approved',
        requester_name: 'John Doe',
        requester_email: 'john@example.com',
        business_justification: 'Business need',
        implementation_plan: 'Implementation steps',
        rollback_plan: 'Rollback steps'
      })
      .execute();

    await executeChangeRequest(testInput);

    // Verify status was updated
    const updatedChangeRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, testInput.id))
      .execute();

    expect(updatedChangeRequests).toHaveLength(1);
    expect(updatedChangeRequests[0].status).toEqual('in_progress');
    expect(updatedChangeRequests[0].actual_start).toBeInstanceOf(Date);
    expect(updatedChangeRequests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject execution of non-existent change request', async () => {
    const result = await executeChangeRequest({ ...testInput, id: 999 });

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Change request not found');
    expect(result.data).toBeUndefined();
  });

  it('should reject execution of change request not in approved status', async () => {
    // Create a draft change request
    await db.insert(changeRequestsTable)
      .values({
        title: 'Test Change',
        description: 'Test change description',
        change_type: 'normal',
        priority: 'medium',
        status: 'draft',
        requester_name: 'John Doe',
        requester_email: 'john@example.com',
        business_justification: 'Business need',
        implementation_plan: 'Implementation steps',
        rollback_plan: 'Rollback steps'
      })
      .execute();

    const result = await executeChangeRequest(testInput);

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Cannot execute change request with status: draft. Must be approved.');
    expect(result.data).toBeUndefined();

    // Verify status was not changed
    const changeRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, testInput.id))
      .execute();

    expect(changeRequests[0].status).toEqual('draft');
    expect(changeRequests[0].actual_start).toBeNull();
  });

  it('should set actual_start timestamp when executing', async () => {
    const beforeExecution = new Date();

    // Create an approved change request
    await db.insert(changeRequestsTable)
      .values({
        title: 'Test Change',
        description: 'Test change description',
        change_type: 'emergency',
        priority: 'critical',
        status: 'approved',
        requester_name: 'Jane Smith',
        requester_email: 'jane@example.com',
        business_justification: 'Critical business need',
        implementation_plan: 'Emergency implementation',
        rollback_plan: 'Emergency rollback'
      })
      .execute();

    await executeChangeRequest(testInput);

    const afterExecution = new Date();

    // Verify actual_start timestamp was set
    const changeRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, testInput.id))
      .execute();

    const actualStart = changeRequests[0].actual_start;
    expect(actualStart).toBeInstanceOf(Date);
    expect(actualStart!.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
    expect(actualStart!.getTime()).toBeLessThanOrEqual(afterExecution.getTime());
  });
});
