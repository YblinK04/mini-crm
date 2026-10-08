

export class NotFoundError extends Error {
  constructor(
    readonly resource: string,
    readonly id?: string,
  ) {
    super(id ? `${resource} not found: ${id}` : `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export function isPrismaNotFound(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: unknown }).code === 'P2025'
  );
}