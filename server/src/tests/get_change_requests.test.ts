
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type CreateChangeRequestInput } from '../schema';
import { getChangeRequests } from '../handlers/get_change_requests';

// Test input for creating change requests
const testInput: CreateChangeRequestInput = {
  title: 'Test Change Request',
  description: 'A test change request for testing purposes',
  change_type: 'normal',
  priority: 'medium',
  requester_name: 'John Doe',
  requester_email: 'john.doe@example.com',
  business_justification: 'This change is needed for business improvement',
  implementation_plan: 'Step-by-step implementation plan',
  rollback_plan: 'Rollback plan in case of issues',
  risk_assessment: 'Low risk assessment',
  impact_assessment: 'Medium impact assessment'
};

const testInput2: CreateChangeRequestInput = {
  title: 'Second Change Request',
  description: 'Another test change request',
  change_type: 'standard',
  priority: 'high',
  requester_name: 'Jane Smith',
  requester_email: 'jane.smith@example.com',
  business_justification: 'Critical business requirement',
  implementation_plan: 'Detailed implementation steps',
  rollback_plan: 'Emergency rollback procedure',
  risk_assessment: null,
  impact_assessment: null
};

describe('getChangeRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no change requests exist', async () => {
    const result = await getChangeRequests();
    expect(result).toEqual([]);
  });

  it('should return all change requests', async () => {
    // Create test change requests separately to ensure different timestamps
    await db.insert(changeRequestsTable)
      .values({
        title: testInput.title,
        description: testInput.description,
        change_type: testInput.change_type,
        priority: testInput.priority,
        requester_name: testInput.requester_name,
        requester_email: testInput.requester_email,
        business_justification: testInput.business_justification,
        implementation_plan: testInput.implementation_plan,
        rollback_plan: testInput.rollback_plan,
        risk_assessment: testInput.risk_assessment,
        impact_assessment: testInput.impact_assessment
      })
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(changeRequestsTable)
      .values({
        title: testInput2.title,
        description: testInput2.description,
        change_type: testInput2.change_type,
        priority: testInput2.priority,
        requester_name: testInput2.requester_name,
        requester_email: testInput2.requester_email,
        business_justification: testInput2.business_justification,
        implementation_plan: testInput2.implementation_plan,
        rollback_plan: testInput2.rollback_plan,
        risk_assessment: testInput2.risk_assessment,
        impact_assessment: testInput2.impact_assessment
      })
      .execute();

    const result = await getChangeRequests();

    expect(result).toHaveLength(2);
    // Since we inserted "Second Change Request" last, it should be first (newest first)
    expect(result[0].title).toEqual('Second Change Request');
    expect(result[1].title).toEqual('Test Change Request');
    
    // Verify all fields are present
    result.forEach(changeRequest => {
      expect(changeRequest.id).toBeDefined();
      expect(changeRequest.title).toBeDefined();
      expect(changeRequest.description).toBeDefined();
      expect(changeRequest.change_type).toBeDefined();
      expect(changeRequest.priority).toBeDefined();
      expect(changeRequest.status).toEqual('draft'); // Default status
      expect(changeRequest.created_at).toBeInstanceOf(Date);
      expect(changeRequest.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return change requests ordered by creation date (newest first)', async () => {
    // Create first change request
    const firstResult = await db.insert(changeRequestsTable)
      .values({
        title: 'First Change Request',
        description: testInput.description,
        change_type: testInput.change_type,
        priority: testInput.priority,
        requester_name: testInput.requester_name,
        requester_email: testInput.requester_email,
        business_justification: testInput.business_justification,
        implementation_plan: testInput.implementation_plan,
        rollback_plan: testInput.rollback_plan
      })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second change request
    const secondResult = await db.insert(changeRequestsTable)
      .values({
        title: 'Second Change Request',
        description: testInput2.description,
        change_type: testInput2.change_type,
        priority: testInput2.priority,
        requester_name: testInput2.requester_name,
        requester_email: testInput2.requester_email,
        business_justification: testInput2.business_justification,
        implementation_plan: testInput2.implementation_plan,
        rollback_plan: testInput2.rollback_plan
      })
      .returning()
      .execute();

    const result = await getChangeRequests();

    expect(result).toHaveLength(2);
    // Newest should be first (Second Change Request)
    expect(result[0].title).toEqual('Second Change Request');
    expect(result[1].title).toEqual('First Change Request');
    
    // Verify ordering by checking timestamps
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle nullable fields correctly', async () => {
    await db.insert(changeRequestsTable)
      .values({
        title: testInput.title,
        description: testInput.description,
        change_type: testInput.change_type,
        priority: testInput.priority,
        requester_name: testInput.requester_name,
        requester_email: testInput.requester_email,
        business_justification: testInput.business_justification,
        implementation_plan: testInput.implementation_plan,
        rollback_plan: testInput.rollback_plan,
        risk_assessment: null,
        impact_assessment: null,
        scheduled_start: null,
        scheduled_end: null
      })
      .execute();

    const result = await getChangeRequests();

    expect(result).toHaveLength(1);
    expect(result[0].risk_assessment).toBeNull();
    expect(result[0].impact_assessment).toBeNull();
    expect(result[0].scheduled_start).toBeNull();
    expect(result[0].scheduled_end).toBeNull();
    expect(result[0].actual_start).toBeNull();
    expect(result[0].actual_end).toBeNull();
  });
});
