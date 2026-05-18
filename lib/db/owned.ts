/**
 * Row-level ownership helpers — always scope user resources by `userId`.
 */

export class OwnedResourceError extends Error {
  readonly code: 'NOT_FOUND';

  constructor() {
    super('NOT_FOUND');
    this.code = 'NOT_FOUND';
    this.name = 'OwnedResourceError';
  }
}

type FindFirstDelegate = {
  findFirst: (args: {
    where: Record<string, unknown>;
    select?: Record<string, boolean>;
    include?: Record<string, unknown>;
  }) => Promise<unknown | null>;
};

/**
 * `findFirst` with `{ id, userId }` — returns null when missing or not owned (no IDOR leak).
 */
export async function findOwnedFirst<T>(
  model: FindFirstDelegate,
  id: string,
  userId: string,
  args?: {
    select?: Record<string, boolean>;
    include?: Record<string, unknown>;
  }
): Promise<T | null> {
  return model.findFirst({
    where: { id, userId },
    ...args,
  }) as Promise<T | null>;
}

export async function findOwnedOrThrow<T>(
  model: FindFirstDelegate,
  id: string,
  userId: string,
  args?: {
    select?: Record<string, boolean>;
    include?: Record<string, unknown>;
  }
): Promise<T> {
  const row = await findOwnedFirst<T>(model, id, userId, args);
  if (!row) {
    throw new OwnedResourceError();
  }
  return row;
}

export function ownedWhere(id: string, userId: string): { id: string; userId: string } {
  return { id, userId };
}
