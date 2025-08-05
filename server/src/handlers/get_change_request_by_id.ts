
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const getChangeRequestById = async (id: number): Promise<ChangeRequest | null> => {
  try {
    const results = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const changeRequest = results[0];
    return {
      ...changeRequest,
      // Ensure dates are properly handled
      scheduled_start: changeRequest.scheduled_start || null,
      scheduled_end: changeRequest.scheduled_end || null,
      actual_start: changeRequest.actual_start || null,
      actual_end: changeRequest.actual_end || null,
      created_at: changeRequest.created_at,
      updated_at: changeRequest.updated_at
    };
  } catch (error) {
    console.error('Failed to get change request by ID:', error);
    throw error;
  }
};
