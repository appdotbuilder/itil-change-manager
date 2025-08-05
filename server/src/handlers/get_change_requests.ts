
import { db } from '../db';
import { changeRequestsTable } from '../db/schema';
import { type ChangeRequest } from '../schema';
import { desc } from 'drizzle-orm';

export const getChangeRequests = async (): Promise<ChangeRequest[]> => {
  try {
    const results = await db.select()
      .from(changeRequestsTable)
      .orderBy(desc(changeRequestsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get change requests:', error);
    throw error;
  }
};
