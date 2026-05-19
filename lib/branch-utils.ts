const TASK_PATTERN = /task[-_](\d+)/i;
const HASH_PATTERN = /#(\d+)/;
const SLASH_NUM_PATTERN = /\/(\d{3,})[-_]/;

export function extractAdoWorkItemId(branchName: string): number | null {
  let m = branchName.match(TASK_PATTERN);
  if (m) return Number(m[1]);

  m = branchName.match(HASH_PATTERN);
  if (m) return Number(m[1]);

  m = branchName.match(SLASH_NUM_PATTERN);
  if (m) return Number(m[1]);

  return null;
}
