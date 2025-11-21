/**
 * Minimal client-side queue so AI requests run one at a time.
 * Prevents users from spamming /api/process and /api/append in parallel.
 */

type QueuedTask<T> = (ctx: { signal: AbortSignal }) => Promise<T>;

class RequestQueue {
  #chain: Promise<unknown> = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.#chain.then(() => task());
    this.#chain = result.catch(() => {});
    return result;
  }
}

const queue = new RequestQueue();

export function enqueueApiRequest<T>(
  task: QueuedTask<T>,
  timeoutMs = 45_000,
): Promise<T> {
  return queue.enqueue(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return task({ signal: controller.signal })
      .finally(() => clearTimeout(timeoutId));
  });
}
