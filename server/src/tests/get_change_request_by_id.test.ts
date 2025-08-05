
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type CreateChangeRequestInput } from '../schema';
import { getChangeRequestById } from '../handlers/get_change_request_by_id';

// Test input for creating change request
const testInput: CreateChangeRequestInput = {
  title: 'Test Change Request',
  description: 'A change request for testing',
  change_type: 'normal',
  priority: 'medium',
  requester_name: 'John Doe',
  requester_email: 'john.doe@example.com',
  business_justification: 'Required for testing',
  implementation_plan: 'Install and configure test environment',
  rollback_plan: 'Restore from backup',
  risk_assessment: 'Low risk',
  impact_assessment: 'Minimal impact',
  scheduled_start: new Date('2024-12-20T10:00:00Z'),
  scheduled_end: new Date('2024-12-20T12:00:00Z')
};

describe('getChangeRequestById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return change request when it exists', async () => {
    // Create a test change request
    const insertResult = await db.insert(changeRequestsTable)
      .values({
        ...testInput,
        status: 'draft' // Default status
      })
      .returning()
      .execute();

    const createdId = insertResult[0].id;

    // Get the change request by ID
    const result = await getChangeRequestById(createdId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdId);
    expect(result!.title).toEqual('Test Change Request');
    expect(result!.description).toEqual(testInput.description);
    expect(result!.change_type).toEqual('normal');
    expect(result!.priority).toEqual('medium');
    expect(result!.status).toEqual('draft');
    expect(result!.requester_name).toEqual('John Doe');
    expect(result!.requester_email).toEqual('john.doe@example.com');
    expect(result!.business_justification).toEqual(testInput.business_justification);
    expect(result!.implementation_plan).toEqual(testInput.implementation_plan);
    expect(result!.rollback_plan).toEqual(testInput.rollback_plan);
    expect(result!.risk_assessment).toEqual('Low risk');
    expect(result!.impact_assessment).toEqual('Minimal impact');
    expect(result!.scheduled_start).toBeInstanceOf(Date);
    expect(result!.scheduled_end).toBeInstanceOf(Date);
    expect(result!.actual_start).toBeNull();
    expect(result!.actual_end).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when change request does not exist', async () => {
    const nonExistentId = 999;
    
    const result = await getChangeRequestById(nonExistentId);
    
    expect(result).toBeNull();
  });

  it('should handle change request with null optional fields', async () => {
    // Create a change request with minimal required fields
    const minimalInput = {
      title: 'Minimal Change Request',
      description: 'Minimal description',
      change_type: 'standard' as const,
      priority: 'low' as const,
      requester_name: 'Jane Doe',
      requester_email: 'jane.doe@example.com',
      business_justification: 'Business need',
      implementation_plan: 'Simple implementation',
      rollback_plan: 'Simple rollback',
      status: 'draft' as const
    };

    const insertResult = await db.insert(changeRequestsTable)
      .values(minimalInput)
      .returning()
      .execute();

    const createdId = insertResult[0].id;

    // Get the change request by ID
    const result = await getChangeRequestById(createdId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdId);
    expect(result!.title).toEqual('Minimal Change Request');
    expect(result!.risk_assessment).toBeNull();
    expect(result!.impact_assessment).toBeNull();
    expect(result!.scheduled_start).toBeNull();
    expect(result!.scheduled_end).toBeNull();
    expect(result!.actual_start).toBeNull();
    expect(result!.actual_end).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
