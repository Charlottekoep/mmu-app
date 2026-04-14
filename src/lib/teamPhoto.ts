/**
 * Constructs the public Supabase Storage URL for a team member's headshot.
 * Files are stored as `[Name].png` in the `team-photos` bucket.
 *
 * Special filename mappings:
 *   J'Mari  → J_Mari.png   (apostrophe → underscore)
 *   Simoné  → Simone.png   (remove accent)
 */
export function getTeamPhotoUrl(name: string): string {
  const filename = name
    .replace(/'/g, '_')   // J'Mari → J_Mari
    .replace(/é/g, 'e')   // Simoné → Simone

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/team-photos/${filename}.png`
}
