// Dev-only artificial delay for visually auditing loading.tsx / Skeleton
// states against each page's real layout — without it, local data resolves
// too fast to ever actually see the loading UI render.
//
// Usage: `DEBUG_SLOW_LOAD=2000 npm run dev`, then open any page that calls
// this at the top of its Server Component. Unset (or production) is a
// single no-op env read, effectively free.
export async function debugSlowLoad(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  const ms = Number(process.env.DEBUG_SLOW_LOAD);
  if (!ms || ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
