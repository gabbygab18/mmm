/**
 * Single source of truth for the MMM social profile URLs.
 *
 * Pages render their own icon art (the footer and the inner pages use
 * different assets), so only the destinations live here — that way the
 * homepage footer and the contact page can never drift apart again.
 */

export const SOCIAL_URLS = {
  facebook: 'https://www.facebook.com/profile.php?id=61590198659207',
  instagram: 'https://www.instagram.com/margaretsmemorycaremusic/',
  youtube: 'https://www.youtube.com/@MargaretsMemorycareMusic',
  tiktok: 'https://www.tiktok.com/@margaretsmemorycaremusic',
} as const
