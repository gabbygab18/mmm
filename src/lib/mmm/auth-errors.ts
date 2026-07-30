/**
 * Turns Supabase auth errors into something a volunteer musician or an
 * activities director can act on.
 *
 * The raw strings come straight from GoTrue and read like server logs —
 * "Error sending confirmation email" tells someone filling in a registration
 * form nothing about what to do next, and looks like they did something wrong.
 */

const SUPPORT_EMAIL = 'info@margaretsmemorycaremusic.org'

export function friendlyAuthError(message: string | null | undefined): string {
  const raw = (message ?? '').trim()
  const lower = raw.toLowerCase()

  // The project has e-mail confirmation switched on but cannot send the mail,
  // so the account is not created at all. Nothing the person can fix.
  // GoTrue rolls the new row back when the confirmation e-mail cannot be sent
  // and then reports it as a database failure, so both messages mean the same
  // thing to the person filling in the form: the account was not created.
  if (
    lower.includes('sending confirmation email') ||
    lower.includes('error sending') ||
    lower.includes('database error saving new user')
  ) {
    return `We could not send your confirmation e-mail, so your account was not created. This is a problem on our side — please try again in a few minutes, or e-mail ${SUPPORT_EMAIL} and we will set you up.`
  }

  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with that e-mail address already exists. Try signing in instead, or use the password reset link.'
  }

  if (lower.includes('password should be at least')) {
    return 'Please choose a password with at least 8 characters.'
  }

  if (lower.includes('invalid login credentials')) {
    return 'That e-mail address and password do not match. Please check them and try again.'
  }

  if (lower.includes('email rate limit') || lower.includes('over_email_send_rate_limit')) {
    return `Too many sign-up e-mails have gone out in the last hour. Please try again shortly, or e-mail ${SUPPORT_EMAIL}.`
  }

  if (lower.includes('unable to validate email address') || lower.includes('invalid format')) {
    return 'That e-mail address does not look right — please check it and try again.'
  }

  return raw || 'Something went wrong. Please try again.'
}
