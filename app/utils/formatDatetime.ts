export function formatDateTime(
	t: string,
	locale: string,
	options: Intl.DateTimeFormatOptions = {
		dateStyle: 'medium',
		timeStyle: 'short',
	},
) {
	const zonedDateTime = Temporal.Instant.from(t).toZonedDateTimeISO(
		Temporal.Now.timeZoneId(),
	)

	return zonedDateTime.toLocaleString(locale, options)
}
