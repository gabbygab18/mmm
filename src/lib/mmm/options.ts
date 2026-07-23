/**
 * Controlled vocabularies for the registration and request forms.
 *
 * These replace the free-text inputs the client flagged in July 2026. Keeping
 * the lists here means the musician wizard, facility wizard, and admin filters
 * all speak the same language — which is what makes matching work later.
 */

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
] as const

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export const TIME_OF_DAY = [
  'Morning (9:00 AM – 12:00 PM)',
  'Early afternoon (12:00 – 3:00 PM)',
  'Late afternoon (3:00 – 5:00 PM)',
  'Evening (after 5:00 PM)',
] as const

export const VISIT_FREQUENCY = ['Weekly', 'Every two weeks', 'Monthly', 'Every other month', 'Occasionally'] as const

export const PERFORMANCE_LENGTH = ['30 minutes', '45 minutes', '60 minutes', '90 minutes'] as const

export const PERFORMANCE_LOCATIONS = [
  'Activity room',
  'Dining room',
  'Common lounge',
  'Courtyard or patio',
  'Memory care neighborhood',
  'Chapel',
] as const

export const CONTACT_METHODS = ['E-mail', 'Phone call', 'Text message'] as const

export const DIRECTOR_JOB_TITLES = [
  'Activities Director',
  'Activities Coordinator',
  'Life Enrichment Director',
  'Executive Director',
  'Memory Care Director',
  'Resident Services Director',
  'Volunteer Coordinator',
  'Other',
] as const

export const INSTRUMENTS = [
  'Vocals', 'Acoustic guitar', 'Electric guitar', 'Piano', 'Keyboard', 'Violin', 'Viola', 'Cello',
  'Flute', 'Clarinet', 'Saxophone', 'Trumpet', 'Trombone', 'Harmonica', 'Ukulele', 'Banjo',
  'Mandolin', 'Accordion', 'Harp', 'Percussion', 'Bass', 'Other',
] as const

export const GENRES = [
  'Big band & swing', 'Jazz', 'Classical', 'Folk', 'Country', 'Gospel & hymns', 'Broadway & standards',
  'Oldies (50s–60s)', 'Rock (60s–70s)', 'Latin', 'Holiday', 'Patriotic',
] as const

export const YEARS_EXPERIENCE = [
  'Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10–20 years', 'More than 20 years',
] as const

export const PERFORMANCE_TYPES = ['Solo', 'Duo', 'Small group (3–5)', 'Large group (6+)', 'Choir or vocal ensemble'] as const

export const TRAVEL_DISTANCES = [
  'Within 5 miles', 'Within 10 miles', 'Within 15 miles', 'Within 25 miles', 'Within 50 miles', 'Any distance',
] as const

export const LANGUAGES = ['English', 'Spanish', 'Haitian Creole', 'Portuguese', 'French', 'Russian', 'Other'] as const

export const EQUIPMENT_NEEDED = [
  'None — musician brings everything',
  'Microphone and PA system',
  'Power outlet access',
  'Music stand',
  'Seating for the performer',
  'Piano or keyboard on site',
] as const
