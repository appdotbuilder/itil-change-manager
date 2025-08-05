
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequestActionInput, type CreateChangeRequestInput } from '../schema';
import { requestPermission } from '../handlers/request_permission';
import { eq } from 'drizzle-orm';

// Test change request data
const testChangeRequest: CreateChangeRequestInput = {
  title: 'Test Change Request',
  description: 'A test change request for permission testing',
  change_type: 'normal',
  priority: 'medium',
  requester_name: 'John Doe',
  requester_email: 'john.doe@example.com',
  business_justification: 'Required for system improvement',
  implementation_plan: 'Deploy new configuration',
  rollback_plan: 'Revert to previous configuration',
  risk_assessment: 'Low risk',
  impact_assessment: 'Minimal impact'
};

describe('requestPermission', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully request permission for draft change request', async () => {
    // Create a change request in draft status
    const createResult = await db.insert(changeRequestsTable)
      .values({
        ...testChangeRequest,
        status: 'draft'
      })
      .returning()
      .execute();

    const changeRequest = createResult[0];

    const input: ChangeRequestActionInput = {
      id: changeRequest.id,
      action: 'request_permission',
      notes: 'Requesting approval for urgent change'
    };

    const result = await requestPermission(input);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Permission request sent successfully');
    expect(result.data).toBeDefined();
    expect(result.data.changeId).toBe(changeRequest.id);
    expect(result.data.permissionStatus).toBe('pending');
    expect(result.data.requestData).toBeDefined();
    expect(result.data.requestData.title).toBe(testChangeRequest.title);
    expect(result.data.requestData.notes).toBe('Requesting approval for urgent change');
  });

  it('should update status from draft to submitted', async () => {
    // Create a change request in draft status
    const createResult = await db.insert(changeRequestsTable)
      .values({
        ...testChangeRequest,
        status: 'draft'
      })
      .returning()
      .execute();

    const changeRequest = createResult[0];

    const input: ChangeRequestActionInput = {
      id: changeRequest.id,
      action: 'request_permission'
    };

    await requestPermission(input);

    // Verify status was updated
    const updatedChangeRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, changeRequest.id))
      .execute();

    expect(updatedChangeRequests).toHaveLength(1);
    expect(updatedChangeRequests[0].status).toBe('submitted');
    expect(updatedChangeRequests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle submitted change request without status change', async () => {
    // Create a change request already in submitted status
    const createResult = await db.insert(changeRequestsTable)
      .values({
        ...testChangeRequest,
        status: 'submitted'
      })
      .returning()
      .execute();

    const changeRequest = createResult[0];

    const input: ChangeRequestActionInput = {
      id: changeRequest.id,
      action: 'request_permission'
    };

    const result = await requestPermission(input);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Permission request sent successfully');

    // Verify status remains unchanged
    const unchangedChangeRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, changeRequest.id))
      .execute();

    expect(unchangedChangeRequests[0].status).toBe('submitted');
  });

  it('should fail for non-existent change request', async () => {
    const input: ChangeRequestActionInput = {
      id: 99999,
      action: 'request_permission'
    };

    const result = await requestPermission(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Change request with ID 99999 not found');
    expect(result.data).toBeUndefined();
  });

  it('should fail for change request with invalid status', async () => {
    // Create a change request with approved status
    const createResult = await db.insert(changeRequestsTable)
      .values({
        ...testChangeRequest,
        status: 'approved'
      })
      .returning()
      .execute();

    const changeRequest = createResult[0];

    const input: ChangeRequestActionInput = {
      id: changeRequest.id,
      action: 'request_permission'
    };

    const result = await requestPermission(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot request permission for change request with status: approved');
    expect(result.message).toContain('Valid statuses are: draft, submitted');
  });

  it('should include all relevant data in permission request', async () => {
    // Create a change request with all fields
    const fullChangeRequest = {
      ...testChangeRequest,
      risk_assessment: 'Medium risk assessment',
      impact_assessment: 'Significant impact on users'
    };

    const createResult = await db.insert(changeRequestsTable)
      .values({
        ...fullChangeRequest,
        status: 'draft'
      })
      .returning()
      .execute();

    const changeRequest = createResult[0];

    const input: ChangeRequestActionInput = {
      id: changeRequest.id,
      action: 'request_permission',
      notes: 'Additional context for approval'
    };

    const result = await requestPermission(input);

    expect(result.success).toBe(true);
    expect(result.data.requestData.changeType).toBe('normal');
    expect(result.data.requestData.priority).toBe('medium');
    expect(result.data.requestData.requesterEmail).toBe('john.doe@example.com');
    expect(result.data.requestData.businessJustification).toBe('Required for system improvement');
    expect(result.data.requestData.riskAssessment).toBe('Medium risk assessment');
    expect(result.data.requestData.notes).toBe('Additional context for approval');
  });
});
