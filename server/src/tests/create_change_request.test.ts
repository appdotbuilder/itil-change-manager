
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type CreateChangeRequestInput } from '../schema';
import { createChangeRequest } from '../handlers/create_change_request';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateChangeRequestInput = {
  title: 'Test Change Request',
  description: 'A test change request for system updates',
  change_type: 'normal',
  priority: 'medium',
  requester_name: 'John Doe',
  requester_email: 'john.doe@example.com',
  business_justification: 'Required for system security updates',
  implementation_plan: 'Deploy updates during maintenance window',
  rollback_plan: 'Restore from backup if issues occur',
  risk_assessment: 'Medium risk - thoroughly tested',
  impact_assessment: 'Low impact - minimal downtime expected',
  scheduled_start: new Date('2024-02-01T10:00:00Z'),
  scheduled_end: new Date('2024-02-01T12:00:00Z')
};

describe('createChangeRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a change request with all fields', async () => {
    const result = await createChangeRequest(testInput);

    // Validate all fields are correctly set
    expect(result.title).toEqual('Test Change Request');
    expect(result.description).toEqual(testInput.description);
    expect(result.change_type).toEqual('normal');
    expect(result.priority).toEqual('medium');
    expect(result.status).toEqual('draft'); // Default status
    expect(result.requester_name).toEqual('John Doe');
    expect(result.requester_email).toEqual('john.doe@example.com');
    expect(result.business_justification).toEqual(testInput.business_justification);
    expect(result.implementation_plan).toEqual(testInput.implementation_plan);
    expect(result.rollback_plan).toEqual(testInput.rollback_plan);
    expect(result.risk_assessment).toEqual('Medium risk - thoroughly tested');
    expect(result.impact_assessment).toEqual('Low impact - minimal downtime expected');
    expect(result.scheduled_start).toEqual(new Date('2024-02-01T10:00:00Z'));
    expect(result.scheduled_end).toEqual(new Date('2024-02-01T12:00:00Z'));
    expect(result.actual_start).toBeNull();
    expect(result.actual_end).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save change request to database', async () => {
    const result = await createChangeRequest(testInput);

    // Query database to verify record was saved
    const changeRequests = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, result.id))
      .execute();

    expect(changeRequests).toHaveLength(1);
    const savedRequest = changeRequests[0];
    expect(savedRequest.title).toEqual('Test Change Request');
    expect(savedRequest.description).toEqual(testInput.description);
    expect(savedRequest.change_type).toEqual('normal');
    expect(savedRequest.priority).toEqual('medium');
    expect(savedRequest.status).toEqual('draft');
    expect(savedRequest.requester_name).toEqual('John Doe');
    expect(savedRequest.requester_email).toEqual('john.doe@example.com');
    expect(savedRequest.created_at).toBeInstanceOf(Date);
    expect(savedRequest.updated_at).toBeInstanceOf(Date);
  });

  it('should create change request with minimal fields (nullable fields omitted)', async () => {
    const minimalInput: CreateChangeRequestInput = {
      title: 'Minimal Change Request',
      description: 'Basic change request with required fields only',
      change_type: 'standard',
      priority: 'low',
      requester_name: 'Jane Smith',
      requester_email: 'jane.smith@example.com',
      business_justification: 'Standard maintenance procedure',
      implementation_plan: 'Apply standard configuration changes',
      rollback_plan: 'Use standard rollback procedure'
    };

    const result = await createChangeRequest(minimalInput);

    expect(result.title).toEqual('Minimal Change Request');
    expect(result.change_type).toEqual('standard');
    expect(result.priority).toEqual('low');
    expect(result.status).toEqual('draft');
    expect(result.risk_assessment).toBeNull();
    expect(result.impact_assessment).toBeNull();
    expect(result.scheduled_start).toBeNull();
    expect(result.scheduled_end).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle different change types and priorities', async () => {
    const emergencyInput: CreateChangeRequestInput = {
      ...testInput,
      title: 'Emergency Security Patch',
      change_type: 'emergency',
      priority: 'critical'
    };

    const result = await createChangeRequest(emergencyInput);

    expect(result.title).toEqual('Emergency Security Patch');
    expect(result.change_type).toEqual('emergency');
    expect(result.priority).toEqual('critical');
    expect(result.status).toEqual('draft');
  });
});
