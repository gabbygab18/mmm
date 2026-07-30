import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/get-started',
  '/education',
  '/about',
  '/how-it-works',
  '/why-music-matters',
  '/faq',
  '/contact',
  '/terms',
  '/privacy',
]
const PUBLIC_PREFIXES = ['/register', '/api/contact']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

/**
 * Hostnames that serve the coming-soon placeholder — the public domains only.
 * margaretsmemorycaremusic.org is the main site (it also carries the email), and
 * .com redirects to it at the platform level; both are listed so the placeholder
 * still holds if a request reaches the app on either one. Every other host
 * (mmm-phi-henna.vercel.app, preview URLs, localhost) runs the full app, so the
 * site can be worked on and reviewed while the public domains stay dark.
 */
const COMING_SOON_HOSTS = [
  'margaretsmemorycaremusic.org',
  'www.margaretsmemorycaremusic.org',
  'margaretsmemorycaremusic.com',
  'www.margaretsmemorycaremusic.com',
]

/**
 * Is the coming-soon placeholder active for this request?
 *
 * The host decides, so one deployment can serve the placeholder on the public
 * domains and the real site on its vercel.app URL. COMING_SOON adjusts that:
 *   "false" → gate off everywhere; this is the switch to flip at launch.
 *   "all"   → gate on every host, for checking the placeholder locally.
 *   anything else (including "true" or unset) → the hosts listed above.
 */
function isComingSoon(request: NextRequest) {
  const flag = process.env.COMING_SOON?.trim().toLowerCase()
  if (flag === 'false') return false
  if (flag === 'all') return true

  const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  return COMING_SOON_HOSTS.includes(host)
}

export async function middleware(request: NextRequest) {
  // ── Coming-soon gate ──────────────────────────────────────────────────────
  // While the gate is active, every page request serves /coming-soon. Static
  // assets (anything with a file extension, /_next, and the /coming-soon
  // assets) pass through so the placeholder renders. Set COMING_SOON=false in
  // Vercel to go live — no code change needed (redeploy required on Vercel for
  // env changes to apply).
  if (isComingSoon(request)) {
    const { pathname } = request.nextUrl
    const isPlaceholder = pathname === '/coming-soon'
    const isAsset =
      pathname.startsWith('/coming-soon/') ||
      pathname.startsWith('/_next') ||
      /\.[\w]+$/.test(pathname)

    if (!isPlaceholder && !isAsset) {
      const url = request.nextUrl.clone()
      url.pathname = '/coming-soon'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  const { response, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const hasSession = Boolean(user)

  if (!hasSession && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasSession && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}