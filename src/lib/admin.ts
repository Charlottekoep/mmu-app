export const ADMIN_EMAILS = [
  'charlotte@root.co.za',
  'jonny@root.co.za',
  'jonny@rootplatform.com',
] as const

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email)
}
