/**
 * Pickleball tournament age rule:
 * A player's age for the entire calendar year is determined by Jan 1st.
 * i.e. age = currentYear - birthYear, regardless of birth month/day.
 */
export function pickleballAge(dateOfBirth: Date | string): number {
  return new Date().getUTCFullYear() - new Date(dateOfBirth).getUTCFullYear();
}
