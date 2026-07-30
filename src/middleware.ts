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
 * Is the coming-soon placeholder active for this deployment?
 *
 * COMING_SOON wins when set explicitly (case-insensitive true / false).
 * Unset, the gate defaults ON for the Vercel production deployment only, so
 * the live domain stays behind the placeholder while local dev and preview
 * deployments run the full app.
 */
function isComingSoon() {
  const flag = process.env.COMING_SOON?.trim().toLowerCase()
  if (flag === 'true') return true
  if (flag === 'false') return false
  return process.env.VERCEL_ENV === 'production'
}

export async function middleware(request: NextRequest) {
  // ── Coming-soon gate ──────────────────────────────────────────────────────
  // While the gate is active, every page request serves /coming-soon. Static
  // assets (anything with a file extension, /_next, and the /coming-soon
  // assets) pass through so the placeholder renders. Set COMING_SOON=false in
  // Vercel to go live — no code change needed (redeploy required on Vercel for
  // env changes to apply).
  if (isComingSoon()) {
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