const DAY = 864e5
/** The demo is always "today": every date is an offset from now, so it never goes stale. */
export const dateIn = (n: number) => new Date(Date.now() + n * DAY)
export const fmtDay = (n: number) => dateIn(n).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
export const fmtWeekday = (n: number) => dateIn(n).toLocaleDateString('en-IN', { weekday: 'short' })
