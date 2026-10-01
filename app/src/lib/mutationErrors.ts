export function isRetryableMutationError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = error.status;
    if (typeof status === 'number') return status === 0 || status === 408 || status === 429 || status >= 500;
  }

  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === 'AbortError') return true;

  const message = error instanceof Error ? error.message : '';
  return /network|fetch|timeout|timed out|connection/i.test(message);
}

export function getMutationErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'The server rejected this change.';
}
