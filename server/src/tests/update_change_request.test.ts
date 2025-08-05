
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type CreateChangeRequestInput, type UpdateChangeRequestInput } from '../schema';
import { updateChangeRequest } from '../handlers/update_change_request';
import { eq } from 'drizzle-orm';

// Helper to create a test change request
const createTestChangeRequest = async () => {
  const testInput: CreateChangeRequestInput = {
    title: 'Original Test Change',
    description: 'Original description',
    change_type: 'normal',
    priority: 'medium',
    requester_name: 'John Doe',
    requester_email: 'john@example.com',
    business_justification: 'Original business justification',
    implementation_plan: 'Original implementation plan',
    rollback_plan: 'Original rollback plan',
    risk_assessment: 'Original risk assessment',
    impact_assessment: 'Original impact assessment',
    scheduled_start: new Date('2024-01-15T10:00:00Z'),
    scheduled_end: new Date('2024-01-15T12:00:00Z')
  };

  const result = await db.insert(changeRequestsTable)
    .values({
      ...testInput,
      status: 'draft'
    })
    .returning()
    .execute();

  return result[0];
};

// Test update input
const testUpdateInput: Omit<UpdateChangeRequestInput, 'id'> = {
  title: 'Updated Test Change',
  description: 'Updated description',
  change_type: 'emergency',
  priority: 'critical',
  requester_name: 'Jane Smith',
  requester_email: 'jane@example.com',
  business_justification: 'Updated business justification',
  implementation_plan: 'Updated implementation plan',
  rollback_plan: 'Updated rollback plan',
  risk_assessment: 'Updated risk assessment',
  impact_assessment: 'Updated impact assessment',
  scheduled_start: new Date('2024-02-01T14:00:00Z'),
  scheduled_end: new Date('2024-02-01T16:00:00Z')
};

describe('updateChangeRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a change request', async () => {
    const created = await createTestChangeRequest();
    const updateInput = { id: created.id, ...testUpdateInput };

    const result = await updateChangeRequest(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(created.id);
    expect(result.title).toEqual('Updated Test Change');
    expect(result.description).toEqual('Updated description');
    expect(result.change_type).toEqual('emergency');
    expect(result.priority).toEqual('critical');
    expect(result.requester_name).toEqual('Jane Smith');
    expect(result.requester_email).toEqual('jane@example.com');
    expect(result.business_justification).toEqual('Updated business justification');
    expect(result.implementation_plan).toEqual('Updated implementation plan');
    expect(result.rollback_plan).toEqual('Updated rollback plan');
    expect(result.risk_assessment).toEqual('Updated risk assessment');
    expect(result.impact_assessment).toEqual('Updated impact assessment');
    expect(result.scheduled_start).toEqual(new Date('2024-02-01T14:00:00Z'));
    expect(result.scheduled_end).toEqual(new Date('2024-02-01T16:00:00Z'));
    
    // Verify timestamps
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > created.updated_at).toBe(true);
  });

  it('should update partial fields', async () => {
    const created = await createTestChangeRequest();
    const partialUpdate: UpdateChangeRequestInput = {
      id: created.id,
      title: 'Partially Updated Title',
      priority: 'high'
    };

    const result = await updateChangeRequest(partialUpdate);

    // Verify updated fields
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.priority).toEqual('high');
    
    // Verify unchanged fields
    expect(result.description).toEqual('Original description');
    expect(result.change_type).toEqual('normal');
    expect(result.requester_name).toEqual('John Doe');
    expect(result.requester_email).toEqual('john@example.com');
    
    // Verify updated_at was changed
    expect(result.updated_at > created.updated_at).toBe(true);
  });

  it('should save updated change request to database', async () => {
    const created = await createTestChangeRequest();
    const updateInput = { id: created.id, ...testUpdateInput };

    await updateChangeRequest(updateInput);

    // Query database directly to verify persistence
    const updatedInDb = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, created.id))
      .execute();

    const dbRecord = updatedInDb[0];
    expect(dbRecord.title).toEqual('Updated Test Change');
    expect(dbRecord.description).toEqual('Updated description');
    expect(dbRecord.change_type).toEqual('emergency');
    expect(dbRecord.priority).toEqual('critical');
    expect(dbRecord.requester_name).toEqual('Jane Smith');
    expect(dbRecord.updated_at).toBeInstanceOf(Date);
    expect(dbRecord.updated_at > created.updated_at).toBe(true);
  });

  it('should handle nullable fields correctly', async () => {
    const created = await createTestChangeRequest();
    const updateWithNulls: UpdateChangeRequestInput = {
      id: created.id,
      risk_assessment: null,
      impact_assessment: null,
      scheduled_start: null,
      scheduled_end: null
    };

    const result = await updateChangeRequest(updateWithNulls);

    expect(result.risk_assessment).toBeNull();
    expect(result.impact_assessment).toBeNull();
    expect(result.scheduled_start).toBeNull();
    expect(result.scheduled_end).toBeNull();
  });

  it('should throw error for non-existent change request', async () => {
    const nonExistentId = 99999;
    const updateInput: UpdateChangeRequestInput = {
      id: nonExistentId,
      title: 'Should not work'
    };

    await expect(updateChangeRequest(updateInput)).rejects.toThrow(/not found/i);
  });
});
