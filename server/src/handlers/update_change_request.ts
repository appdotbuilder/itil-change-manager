
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type UpdateChangeRequestInput, type ChangeRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChangeRequest = async (input: UpdateChangeRequestInput): Promise<ChangeRequest> => {
  try {
    // Check if change request exists
    const existing = await db.select()
      .from(changeRequestsTable)
      .where(eq(changeRequestsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Change request with id ${input.id} not found`);
    }

    // Prepare update data, excluding id and setting updated_at
    const { id, ...updateData } = input;
    const updateValues = {
      ...updateData,
      updated_at: new Date()
    };

    // Update the change request
    const result = await db.update(changeRequestsTable)
      .set(updateValues)
      .where(eq(changeRequestsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Change request update failed:', error);
    throw error;
  }
};
