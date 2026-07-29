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

export async function middleware(request: NextRequest) {
  // ── Coming-soon gate ──────────────────────────────────────────────────────
  // While COMING_SOON=true, every page request serves /coming-soon. Static
  // assets (anything with a file extension, /_next, and the /coming-soon assets)
  // pass through so the placeholder renders. Flip the env var to disable — no
  // code change needed (redeploy required on Vercel for env changes to apply).
  if (process.env.COMING_SOON === 'true') {
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
