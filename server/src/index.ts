
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createChangeRequestInputSchema, 
  updateChangeRequestInputSchema,
  changeRequestActionInputSchema
} from './schema';

// Import handlers
import { createChangeRequest } from './handlers/create_change_request';
import { getChangeRequests } from './handlers/get_change_requests';
import { getChangeRequestById } from './handlers/get_change_request_by_id';
import { updateChangeRequest } from './handlers/update_change_request';
import { applyChangeRequest } from './handlers/apply_change_request';
import { requestPermission } from './handlers/request_permission';
import { executeChangeRequest } from './handlers/execute_change_request';
import { completeChangeRequest } from './handlers/complete_change_request';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Change Request CRUD operations
  createChangeRequest: publicProcedure
    .input(createChangeRequestInputSchema)
    .mutation(({ input }) => createChangeRequest(input)),

  getChangeRequests: publicProcedure
    .query(() => getChangeRequests()),

  getChangeRequestById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getChangeRequestById(input.id)),

  updateChangeRequest: publicProcedure
    .input(updateChangeRequestInputSchema)
    .mutation(({ input }) => updateChangeRequest(input)),

  // ITIL workflow actions
  applyChangeRequest: publicProcedure
    .input(changeRequestActionInputSchema)
    .mutation(({ input }) => applyChangeRequest(input)),

  requestPermission: publicProcedure
    .input(changeRequestActionInputSchema)
    .mutation(({ input }) => requestPermission(input)),

  executeChangeRequest: publicProcedure
    .input(changeRequestActionInputSchema)
    .mutation(({ input }) => executeChangeRequest(input)),

  completeChangeRequest: publicProcedure
    .input(changeRequestActionInputSchema)
    .mutation(({ input }) => completeChangeRequest(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`ITIL Change Request Management TRPC server listening at port: ${port}`);
}

start();
