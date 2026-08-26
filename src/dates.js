/**
 * Pure date helpers for jpui-calendar. No Vue, no wwLib — everything here is
 * testable in isolation and imported by `wwElement.vue`.
 *
 * The whole component speaks one currency: a **date key**, `"YYYY-MM-DD"`.
 * Dates never leave this module as `Date` objects or full ISO timestamps,
 * because a timestamp serialised through a WeWeb variable and read back in
 * another timezone lands on the wrong day. A date key cannot drift.
 */

import {
    addDays,
    addMonths,
    differenceInCalendarDays,
    eachDayOfInterval,
    endOfWeek,
    format as formatDate,
    getDay,
    getISOWeek,
    getWeek,
    isAfter,
    isBefore,
    isSameMonth,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from 'date-fns';

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** `Date` → `"YYYY-MM-DD"`, read in local time. `null` for anything unusable. */
export function toDateKey(date) {
    if (!isValidDate(date)) return null;
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Anything → `Date` at local midnight, or `null`.
 *
 * Deliberately tolerant: a bound formula can hand us a `Date`, a timestamp, a
 * full ISO string, a `"YYYY-MM-DD"` key, or junk. Everything that isn't a real
 * date returns `null` rather than an Invalid Date, so callers only ever have to
 * check for null.
 */
export function fromDateKey(raw) {
    if (raw === null || raw === undefined || raw === '') return null;

    if (isValidDate(raw)) return startOfDay(raw);

    if (typeof raw === 'number') {
        const fromNumber = new Date(raw);
        return isValidDate(fromNumber) ? startOfDay(fromNumber) : null;
    }

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) return null;

        // Parse `YYYY-MM-DD` by hand. `new Date("2026-08-14")` is parsed as UTC
        // midnight by spec, which is the previous day for anyone west of GMT.
        const match = DATE_KEY_RE.exec(trimmed);
        if (match) {
            const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            return isValidDate(parsed) ? parsed : null;
        }

        const fallback = new Date(trimmed);
        return isValidDate(fallback) ? startOfDay(fallback) : null;
    }

    return null;
}

/** Duck-typed: `instanceof Date` is false across realms in the WeWeb editor. */
function isValidDate(value) {
    return (
        !!value &&
        typeof value === 'object' &&
        typeof value.getTime === 'function' &&
        !Number.isNaN(value.getTime())
    );
}

/** Convenience: anything → date key, in one hop. */
export function coerceDateKey(raw) {
    return toDateKey(fromDateKey(raw));
}

/** True for a plain object — i.e. not a Date, not an array. */
function isPlainObject(value) {
    return (
        !!value && typeof value === 'object' && !Array.isArray(value) && typeof value.getTime !== 'function'
    );
}

/**
 * Normalise a raw value (init value, action argument, bound formula) into the
 * shape this component stores for the given mode.
 *
 * - `single` → `"YYYY-MM-DD"` or `null`
 * - `range`  → `{ start, end }`, either side nullable
 *
 * Both directions are lossy-tolerant on purpose: `{start,end}`, `{from,to}`, a
 * two-item array and a bare date are all accepted in either mode, because every
 * one of those turns up in real WeWeb bindings — and because switching the Mode
 * property on a populated calendar should keep the date, not blank it.
 */
export function normalizeValue(raw, mode) {
    if (mode === 'range') {
        if (raw === null || raw === undefined || raw === '') return { start: null, end: null };

        if (Array.isArray(raw)) {
            return orderRange(coerceDateKey(raw[0]), coerceDateKey(raw[1]));
        }

        if (isPlainObject(raw)) {
            const start = coerceDateKey(raw.start ?? raw.from ?? raw.startDate ?? null);
            const end = coerceDateKey(raw.end ?? raw.to ?? raw.endDate ?? null);
            return orderRange(start, end);
        }

        return orderRange(coerceDateKey(raw), null);
    }

    if (Array.isArray(raw)) return coerceDateKey(raw[0]);
    if (isPlainObject(raw)) return coerceDateKey(raw.start ?? raw.from ?? raw.startDate ?? null);

    return coerceDateKey(raw);
}

/** Keep `start` <= `end`. A lone `end` is promoted to `start`. */
export function orderRange(start, end) {
    if (start && end && end < start) return { start: end, end: start };
    if (!start && end) return { start: end, end: null };
    return { start: start ?? null, end: end ?? null };
}

export function isRangeEmpty(range) {
    return !range || (!range.start && !range.end);
}

/** Inclusive day count of a complete range; `0` while it is still open. */
export function rangeDayCount(range) {
    const start = fromDateKey(range?.start);
    const end = fromDateKey(range?.end);
    if (!start || !end) return 0;
    return differenceInCalendarDays(end, start) + 1;
}

/* ─── Locale-aware names ──────────────────────────────────────────────────────
 * `Intl` rather than date-fns locales: date-fns ships one module per locale, so
 * covering the languages a NoCode user might pick would mean bundling dozens of
 * them. `Intl` is already in every browser and costs nothing.
 */

function safeFormatter(locale, options) {
    try {
        return new Intl.DateTimeFormat(locale || undefined, options);
    } catch {
        // An invalid BCP-47 tag throws. Fall back to the runtime default rather
        // than rendering an empty calendar.
        return new Intl.DateTimeFormat(undefined, options);
    }
}

/** Weekday headers, already rotated to start on `weekStartsOn`. */
export function getWeekdayNames(locale, weekStartsOn, width = 'short') {
    const formatter = safeFormatter(locale, { weekday: width });
    // 2024-01-07 is a Sunday, so `+ offset` walks Sun→Sat.
    const sunday = new Date(2024, 0, 7);
    const names = [];
    for (let index = 0; index < 7; index += 1) {
        const offset = (Number(weekStartsOn) + index) % 7;
        names.push(formatter.format(addDays(sunday, offset)));
    }
    return names;
}

/** The 12 month names for the caption dropdown. */
export function getMonthNames(locale, width = 'long') {
    const formatter = safeFormatter(locale, { month: width });
    const names = [];
    for (let month = 0; month < 12; month += 1) {
        names.push(formatter.format(new Date(2024, month, 1)));
    }
    return names;
}

/** "August 2026" for the caption label. */
export function formatMonthCaption(date, locale) {
    if (!isValidDate(date)) return '';
    return safeFormatter(locale, { month: 'long', year: 'numeric' }).format(date);
}

/** Full accessible label for a day button: "Friday, August 14, 2026". */
export function formatDayLabel(date, locale) {
    if (!isValidDate(date)) return '';
    return safeFormatter(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

/**
 * The user-facing string exposed as `formatted` in local context.
 *
 * `style` is one of `full | long | medium | short | iso | custom`. Only
 * `custom` reaches date-fns, and its localized tokens (`PPP`, `MMMM`) render in
 * English — the presets exist precisely so the `Locale` property stays honest.
 */
export function formatValue(dateKey, { style = 'medium', pattern = 'yyyy-MM-dd', locale } = {}) {
    const date = fromDateKey(dateKey);
    if (!date) return '';
    if (style === 'iso') return dateKey;
    if (style === 'custom') {
        try {
            return formatDate(date, pattern || 'yyyy-MM-dd');
        } catch {
            // An invalid pattern throws inside date-fns. Never let that reach render.
            return dateKey;
        }
    }
    return safeFormatter(locale, { dateStyle: style }).format(date);
}

/* ─── Grid construction ───────────────────────────────────────────────────── */

/**
 * Build the month matrices rendered by the template.
 *
 * This is the component's hot path — it re-runs on every selection and month
 * change — so all the set membership it needs (`disabledKeys`,
 * `disabledWeekdays`) is passed in pre-built rather than recomputed per day.
 *
 * @returns {Array<{key, date, caption, weeks: Array<{key, weekNumber, days: Array}>}>}
 */
export function buildMonths({
    displayedMonth,
    numberOfMonths = 1,
    weekStartsOn = 0,
    showOutsideDays = true,
    fixedWeeks = false,
    showWeekNumber = false,
    isoWeek = false,
    locale,
    mode = 'single',
    selectedKey = null,
    range = null,
    minDate = null,
    maxDate = null,
    disabledKeys = null,
    disabledWeekdays = null,
    today = new Date(),
}) {
    const anchor = startOfMonth(displayedMonth ?? new Date());
    const todayKey = toDateKey(today);
    const weekOptions = { weekStartsOn: Number(weekStartsOn) || 0 };

    const months = [];
    const monthCount = Math.max(1, Math.min(12, Number(numberOfMonths) || 1));

    for (let offset = 0; offset < monthCount; offset += 1) {
        const monthDate = addMonths(anchor, offset);
        const gridStart = startOfWeek(startOfMonth(monthDate), weekOptions);
        let gridEnd = endOfWeek(endOfMonthDay(monthDate), weekOptions);

        // `fixedWeeks` pads to a constant 6 rows so the calendar never changes
        // height between months — the reason shadcn exposes the same option.
        if (fixedWeeks) {
            // `+ 1` before dividing: the interval is inclusive, so a 4-week February
            //  spans 27 days of difference but 28 days of grid.
            const rendered = Math.round((differenceInCalendarDays(gridEnd, gridStart) + 1) / 7);
            if (rendered < 6) gridEnd = addDays(gridEnd, (6 - rendered) * 7);
        }

        const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
        const weeks = [];

        for (let index = 0; index < days.length; index += 7) {
            const weekDays = days.slice(index, index + 7);
            const firstDay = weekDays[0];
            weeks.push({
                key: toDateKey(firstDay),
                weekNumber: showWeekNumber
                    ? isoWeek
                        ? getISOWeek(firstDay)
                        : getWeek(firstDay, weekOptions)
                    : null,
                days: weekDays.map(day =>
                    describeDay(day, {
                        monthDate,
                        todayKey,
                        locale,
                        mode,
                        selectedKey,
                        range,
                        showOutsideDays,
                        minDate,
                        maxDate,
                        disabledKeys,
                        disabledWeekdays,
                    })
                ),
            });
        }

        months.push({
            key: toDateKey(monthDate),
            date: monthDate,
            caption: formatMonthCaption(monthDate, locale),
            weeks,
        });
    }

    return months;
}

function endOfMonthDay(monthDate) {
    return addDays(addMonths(startOfMonth(monthDate), 1), -1);
}

function describeDay(
    date,
    {
        monthDate,
        todayKey,
        locale,
        mode,
        selectedKey,
        range,
        showOutsideDays,
        minDate,
        maxDate,
        disabledKeys,
        disabledWeekdays,
    }
) {
    const key = toDateKey(date);
    const isOutside = !isSameMonth(date, monthDate);

    let isDisabled = false;
    if (minDate && isBefore(date, minDate)) isDisabled = true;
    else if (maxDate && isAfter(date, maxDate)) isDisabled = true;
    else if (disabledKeys?.has(key)) isDisabled = true;
    else if (disabledWeekdays?.has(getDay(date))) isDisabled = true;

    let isSelected = false;
    let isRangeStart = false;
    let isRangeMiddle = false;
    let isRangeEnd = false;
    let isRangeOpen = false;

    if (mode === 'range') {
        const { start, end } = range ?? {};
        isRangeStart = !!start && key === start;
        isRangeEnd = !!end && key === end;
        isRangeMiddle = !!start && !!end && key > start && key < end;
        isSelected = isRangeStart || isRangeEnd || isRangeMiddle;
        // A lone endpoint has nothing to connect to yet, so it must not paint the
        // track: the cell's square outer corners would show around the pill.
        isRangeOpen = (isRangeStart || isRangeEnd) && !(start && end);
    } else {
        isSelected = !!selectedKey && key === selectedKey;
    }

    return {
        key,
        date,
        dayOfMonth: date.getDate(),
        label: formatDayLabel(date, locale),
        isOutside,
        // An outside day with `showOutsideDays` off keeps its grid cell (the
        // week must stay 7 columns wide) but renders nothing inside it.
        isHidden: isOutside && !showOutsideDays,
        isToday: key === todayKey,
        isSelected,
        isRangeStart,
        isRangeMiddle,
        isRangeEnd,
        isRangeOpen,
        isDisabled,
    };
}

/** Clamp a candidate month to the min/max window. */
export function clampMonth(monthDate, minDate, maxDate) {
    if (minDate && isBefore(monthDate, startOfMonth(minDate))) return startOfMonth(minDate);
    if (maxDate && isAfter(monthDate, startOfMonth(maxDate))) return startOfMonth(maxDate);
    return startOfMonth(monthDate);
}
