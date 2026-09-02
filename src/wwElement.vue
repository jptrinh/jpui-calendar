<template>
    <div
        class="jp-cal"
        :class="{
            'is-disabled': isDisabled,
            'is-readonly': isReadonly,
            'is-editing': isEditing,
            'is-fill': isFillWidth,
        }"
        :data-mode="resolvedMode"
        role="group"
        :aria-label="accessibleName"
        :aria-disabled="isDisabled ? 'true' : null"
        :aria-readonly="isReadonly ? 'true' : null"
        :aria-invalid="isInvalid ? 'true' : null"
        :data-ww-disabled="isDisabled ? 'true' : null"
        @focusin="handleFocusIn"
        @focusout="handleFocusOut"
    >
        <div class="jp-cal__months" :class="{ 'is-column': resolvedMonthDirection === 'column' }">
            <!--
                Keyed by position, not by month key. A date key would destroy and rebuild the
                whole month — nav button included — on every month change, and Vue flushes that
                patch between the button's own click handler and any document-level one. A
                closing dropdown (ww-dropdown resolves `event.target.closest('[data-dropdown-uid]')`
                at that point) would then see a detached target and treat the click as outside.
            -->
            <div v-for="(month, monthIndex) in months" :key="monthIndex" class="jp-cal__month">
                <div class="jp-cal__caption">
                    <button
                        v-if="showNavigation && monthIndex === 0"
                        type="button"
                        class="jp-cal__nav jp-cal__nav--prev"
                        :disabled="!canGoPrevious"
                        :aria-label="previousLabel"
                        @click="goToPreviousMonth"
                    >
                        <span class="jp-cal__nav-icon" v-html="previousIconHtml"></span>
                    </button>

                    <div v-if="captionLayout === 'label'" class="jp-cal__caption-label" aria-live="polite">
                        {{ month.caption }}
                    </div>

                    <div v-else class="jp-cal__dropdowns">
                        <span v-if="showMonthDropdown" class="jp-cal__dropdown-root">
                            <select
                                class="jp-cal__dropdown"
                                :aria-label="monthSelectLabel"
                                :disabled="(isDisabled || isReadonly) && !isEditing"
                                :value="month.date.getMonth()"
                                @change="handleMonthSelect(monthIndex, $event)"
                            >
                                <option v-for="(name, index) in monthNames" :key="index" :value="index">
                                    {{ name }}
                                </option>
                            </select>
                            <span class="jp-cal__dropdown-label" aria-hidden="true">
                                {{ monthNames[month.date.getMonth()] }}
                                <span class="jp-cal__dropdown-chevron" v-html="chevronDownIcon"></span>
                            </span>
                        </span>
                        <span v-else class="jp-cal__caption-label">{{ monthNames[month.date.getMonth()] }}</span>

                        <span v-if="showYearDropdown" class="jp-cal__dropdown-root">
                            <select
                                class="jp-cal__dropdown"
                                :aria-label="yearSelectLabel"
                                :disabled="(isDisabled || isReadonly) && !isEditing"
                                :value="month.date.getFullYear()"
                                @change="handleYearSelect(monthIndex, $event)"
                            >
                                <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
                            </select>
                            <span class="jp-cal__dropdown-label" aria-hidden="true">
                                {{ month.date.getFullYear() }}
                                <span class="jp-cal__dropdown-chevron" v-html="chevronDownIcon"></span>
                            </span>
                        </span>
                        <span v-else class="jp-cal__caption-label">{{ month.date.getFullYear() }}</span>
                    </div>

                    <button
                        v-if="showNavigation && monthIndex === months.length - 1"
                        type="button"
                        class="jp-cal__nav jp-cal__nav--next"
                        :disabled="!canGoNext"
                        :aria-label="nextLabel"
                        @click="goToNextMonth"
                    >
                        <span class="jp-cal__nav-icon" v-html="nextIconHtml"></span>
                    </button>
                </div>

                <table
                    class="jp-cal__grid"
                    role="grid"
                    :aria-label="month.caption"
                    :style="{ '--jpc-columns': columnCount }"
                >
                    <thead>
                        <tr class="jp-cal__weekdays">
                            <th v-if="showWeekNumber" scope="col" class="jp-cal__week-number-header">
                                <span class="jp-cal__sr-only">{{ weekNumberLabel }}</span>
                            </th>
                            <th
                                v-for="(weekday, index) in weekdayNames"
                                :key="index"
                                scope="col"
                                class="jp-cal__weekday"
                                :abbr="weekdayLongNames[index]"
                            >
                                {{ weekday }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="week in month.weeks" :key="week.key" class="jp-cal__week">
                            <td v-if="showWeekNumber" class="jp-cal__week-number">
                                <div class="jp-cal__week-number-inner">{{ week.weekNumber }}</div>
                            </td>
                            <td
                                v-for="(day, dayIndex) in week.days"
                                :key="day.key"
                                class="jp-cal__day"
                                :class="{ 'is-row-start': dayIndex === 0, 'is-row-end': dayIndex === 6 }"
                                :data-day="day.key"
                                :data-selected="day.isSelected || undefined"
                                :data-today="day.isToday || undefined"
                                :data-outside="day.isOutside || undefined"
                                :data-disabled="day.isDisabled || undefined"
                                :data-hidden="day.isHidden || undefined"
                                :data-range-start="day.isRangeStart || undefined"
                                :data-range-middle="day.isRangeMiddle || undefined"
                                :data-range-end="day.isRangeEnd || undefined"
                                :data-range-open="day.isRangeOpen || undefined"
                                role="gridcell"
                                :aria-selected="day.isSelected ? 'true' : undefined"
                            >
                                <button
                                    v-if="!day.isHidden"
                                    :ref="el => registerDayButton(el, `${month.key}|${day.key}`)"
                                    type="button"
                                    class="jp-cal__day-btn"
                                    :tabindex="`${month.key}|${day.key}` === activeCellKey ? 0 : -1"
                                    :disabled="isDisabled && !isEditing"
                                    :aria-disabled="day.isDisabled || isReadonly ? 'true' : undefined"
                                    :aria-label="day.label"
                                    :aria-current="day.isToday ? 'date' : undefined"
                                    @click="handleDaySelect(day)"
                                    @keydown="handleKeydown(day, $event)"
                                    @focus="focusedKey = day.key"
                                >
                                    {{ day.dayOfMonth }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { computed, inject, nextTick, onBeforeUnmount, ref, watch, watchEffect } from 'vue';
import { addDays, addMonths, addYears, isAfter, isBefore, startOfMonth } from 'date-fns';

import {
    buildMonths,
    clampMonth,
    coerceDateKey,
    formatValue,
    fromDateKey,
    getMonthNames,
    getWeekdayNames,
    isRangeEmpty,
    normalizeValue,
    rangeDayCount,
    toDateKey,
} from './dates';

// Inline fallbacks so the calendar never renders a blank nav button while the
// icon set is still loading, or when the user picked no icon at all.
// `currentColor` lets the paired Color property drive them from CSS.
const DEFAULT_CHEVRON_LEFT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
const DEFAULT_CHEVRON_RIGHT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
const DEFAULT_CHEVRON_DOWN =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

const isEmptyValue = value => value === null || value === undefined || value === '';

export default {
    props: {
        uid: { type: String, required: true },
        content: { type: Object, required: true },
        /* wwEditor:start */
        wwEditorState: { type: Object, required: true },
        /* wwEditor:end */
        wwElementState: { type: Object, required: true },
    },
    emits: ['trigger-event', 'update:sidepanel-content'],

    setup(props, { emit }) {
        /* wwEditor:start */
        const selectForm = inject('_wwForm:selectForm', () => {});
        /* wwEditor:end */

        // Edition mode only — in the editor's *preview* mode the calendar must behave
        // exactly like production, including a genuinely disabled grid.
        const isEditing = computed(() => {
            /* wwEditor:start */
            return props.wwEditorState?.editMode === wwLib.wwEditorHelper?.EDIT_MODES?.EDITION;
            /* wwEditor:end */
            // eslint-disable-next-line no-unreachable
            return false;
        });

        const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

        // ─── Resolved settings ───────────────────────────────────────────────────

        const resolvedMode = computed(() => (props.content?.mode === 'range' ? 'range' : 'single'));
        const resolvedLocale = computed(() => props.content?.locale || undefined);
        const weekStartsOn = computed(() => {
            const parsed = Number(props.content?.weekStartsOn);
            return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : 0;
        });
        const monthCount = computed(() => {
            const parsed = Number(props.content?.numberOfMonths);
            return Number.isFinite(parsed) ? Math.max(1, Math.min(12, Math.round(parsed))) : 1;
        });
        const resolvedMonthDirection = computed(() =>
            props.content?.monthDirection === 'column' ? 'column' : 'row'
        );
        const captionLayout = computed(() => {
            const layout = props.content?.captionLayout;
            return ['dropdown', 'dropdown-months', 'dropdown-years'].includes(layout) ? layout : 'label';
        });
        const showMonthDropdown = computed(() =>
            ['dropdown', 'dropdown-months'].includes(captionLayout.value)
        );
        const showYearDropdown = computed(() =>
            ['dropdown', 'dropdown-years'].includes(captionLayout.value)
        );
        const showWeekNumber = computed(() => !!props.content?.showWeekNumber);
        // 'hug' (default) keeps the historical behaviour: the calendar is exactly its grid,
        // 7 (or 8) × cell size. 'fill' hands the width back to the container — the columns
        // then split whatever room there is and the day buttons stay square on their own
        // `aspect-ratio`, with the min cell size acting as the floor before it overflows.
        const isFillWidth = computed(() => props.content?.widthMode === 'fill');
        // The grid's floor in fill mode has to know how many columns there actually are,
        // and only the component knows whether the week-number column is showing.
        const columnCount = computed(() => (showWeekNumber.value ? 8 : 7));
        const showNavigation = computed(() => !props.content?.hideNavigation);

        const minDate = computed(() => fromDateKey(props.content?.minDate));
        const maxDate = computed(() => fromDateKey(props.content?.maxDate));

        const minRange = computed(() => Math.max(0, Number(props.content?.minRange) || 0));
        const maxRange = computed(() => Math.max(0, Number(props.content?.maxRange) || 0));

        const accessibleName = computed(() => props.content?.ariaLabel || 'Calendar');

        // ─── Internal variable ───────────────────────────────────────────────────
        // `initValue` reads props only — never the variable back — so the watch below
        // cannot re-trigger itself. Structural loop prevention, no equality guard.
        const initValue = computed(() => {
            const raw = props.content?.initialValue;
            return isEmptyValue(raw) ? null : normalizeValue(raw, resolvedMode.value);
        });

        const { value: variableValue, setValue } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'value',
            type: 'any',
            defaultValue: initValue,
        });

        watch(
            initValue,
            newValue => {
                setValue(newValue);
                emit('trigger-event', { name: 'initValueChange', event: { value: newValue } });
            },
            { immediate: true }
        );

        // The stored value is re-normalised on read rather than on write, so a value
        // set from a workflow or a form reset is understood in whatever shape it
        // arrives without ever mutating what the user handed us.
        const selection = computed(() => normalizeValue(variableValue.value, resolvedMode.value));
        const selectedKey = computed(() => (resolvedMode.value === 'single' ? selection.value : null));
        const rangeValue = computed(() =>
            resolvedMode.value === 'range' ? selection.value : { start: null, end: null }
        );

        // ─── Disabled / read-only / invalid ──────────────────────────────────────

        const isDisabled = computed(() => {
            /* wwEditor:start */
            if (props.wwEditorState?.isSelected) {
                return props.wwElementState?.states?.includes('disabled') ?? false;
            }
            /* wwEditor:end */
            return props.wwElementState?.props?.disabled === undefined
                ? !!props.content?.disabled
                : !!props.wwElementState?.props?.disabled;
        });

        const isReadonly = computed(() => {
            /* wwEditor:start */
            if (props.wwEditorState?.isSelected) {
                return props.wwElementState?.states?.includes('readonly') ?? false;
            }
            /* wwEditor:end */
            return props.wwElementState?.props?.readonly === undefined
                ? !!props.content?.readonly
                : !!props.wwElementState?.props?.readonly;
        });

        const hasInteracted = ref(false);

        const isValueEmpty = computed(() =>
            resolvedMode.value === 'range'
                ? !rangeValue.value.start || !rangeValue.value.end
                : !selectedKey.value
        );

        const isInvalid = computed(() => {
            /* wwEditor:start */
            if (props.wwEditorState?.isSelected) {
                return props.wwElementState?.states?.includes('invalid') ?? false;
            }
            /* wwEditor:end */
            if (props.content?.invalid) return true;
            return !!props.content?.required && hasInteracted.value && isValueEmpty.value;
        });

        // ─── Disabled days ───────────────────────────────────────────────────────

        const resolveField = (formula, item, fallback) => {
            if (!formula) return fallback;
            const resolved = resolveMappingFormula(formula, item);
            return resolved === undefined || resolved === null ? fallback : resolved;
        };

        const disabledKeys = computed(() => {
            const keys = new Set();
            const list = props.content?.disabledDates;
            if (!Array.isArray(list)) return keys;

            for (const item of list) {
                if (item === null || item === undefined) continue;
                // Objects go through the mapping formula; primitives are the date.
                const raw =
                    typeof item === 'object' && typeof item.getTime !== 'function'
                        ? resolveField(props.content?.mappingDisabledDate, item, item.date ?? item.value ?? null)
                        : item;
                const key = coerceDateKey(raw);
                if (key) keys.add(key);
            }
            return keys;
        });

        const disabledWeekdays = computed(() => {
            const days = new Set();
            const list = props.content?.disabledDaysOfWeek;
            if (!Array.isArray(list)) return days;

            for (const item of list) {
                const parsed = Number(typeof item === 'object' && item !== null ? item.day : item);
                if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 6) days.add(parsed);
            }
            return days;
        });

        /** True while the user has picked a start but not yet an end. */
        const pendingStartKey = computed(() =>
            resolvedMode.value === 'range' && rangeValue.value.start && !rangeValue.value.end
                ? rangeValue.value.start
                : null
        );

        /**
         * `minRange` blocks the days that would make the range too short. Greying
         * them out beats silently swallowing the click — and Escape still cancels a
         * pending start. The endpoints themselves stay clickable: clicking one
         * restarts the range rather than resizing it.
         */
        const gridDisabledKeys = computed(() => {
            const { start, end } = rangeValue.value;
            if (!start || minRange.value < 2) return disabledKeys.value;

            const keys = new Set(disabledKeys.value);
            const startDate = fromDateKey(start);
            for (let offset = 1; offset <= minRange.value - 2; offset += 1) {
                keys.add(toDateKey(addDays(startDate, offset)));
                // A pending start can be closed backwards too, so block both sides.
                if (!end) keys.add(toDateKey(addDays(startDate, -offset)));
            }
            return keys;
        });

        /**
         * `maxRange` clamps how far the range can be stretched. Days after the start
         * settle the end, so they hang off the start; days before it push the start
         * back, so they hang off whichever edge stays put.
         */
        const gridMaxDate = computed(() => {
            const { start } = rangeValue.value;
            if (!start || maxRange.value < 1) return maxDate.value;

            const limit = addDays(fromDateKey(start), maxRange.value - 1);
            return maxDate.value && isBefore(maxDate.value, limit) ? maxDate.value : limit;
        });

        const gridMinDate = computed(() => {
            const { start, end } = rangeValue.value;
            const anchor = end || start;
            if (!anchor || maxRange.value < 1) return minDate.value;

            const limit = addDays(fromDateKey(anchor), -(maxRange.value - 1));
            return minDate.value && isAfter(minDate.value, limit) ? minDate.value : limit;
        });

        // ─── Displayed month ─────────────────────────────────────────────────────

        const fallbackMonth = () => {
            const fromDefault = fromDateKey(props.content?.defaultMonth);
            if (fromDefault) return startOfMonth(fromDefault);

            const fromValue = fromDateKey(
                resolvedMode.value === 'range' ? rangeValue.value.start : selectedKey.value
            );
            if (fromValue) return startOfMonth(fromValue);

            return startOfMonth(new Date());
        };

        const displayedMonth = ref(clampMonth(fallbackMonth(), minDate.value, maxDate.value));

        // Only `defaultMonth` re-anchors the view. Watching the value too would yank
        // the grid back every time a workflow wrote to it.
        watch(
            () => props.content?.defaultMonth,
            raw => {
                const parsed = fromDateKey(raw);
                if (parsed) displayedMonth.value = clampMonth(parsed, minDate.value, maxDate.value);
            }
        );

        const setDisplayedMonth = candidate => {
            const next = clampMonth(candidate, minDate.value, maxDate.value);
            if (toDateKey(next) === toDateKey(displayedMonth.value)) return;
            displayedMonth.value = next;
            emit('trigger-event', { name: 'monthChange', event: { value: toDateKey(next) } });
        };

        const lastDisplayedMonth = computed(() => addMonths(displayedMonth.value, monthCount.value - 1));

        const canGoPrevious = computed(
            () => !minDate.value || isAfter(displayedMonth.value, startOfMonth(minDate.value))
        );
        const canGoNext = computed(
            () => !maxDate.value || isBefore(lastDisplayedMonth.value, startOfMonth(maxDate.value))
        );

        const goToPreviousMonth = () => {
            if (!canGoPrevious.value) return;
            setDisplayedMonth(addMonths(displayedMonth.value, -1));
        };
        const goToNextMonth = () => {
            if (!canGoNext.value) return;
            setDisplayedMonth(addMonths(displayedMonth.value, 1));
        };

        // ─── Grid ────────────────────────────────────────────────────────────────

        const months = computed(() =>
            buildMonths({
                displayedMonth: displayedMonth.value,
                numberOfMonths: monthCount.value,
                weekStartsOn: weekStartsOn.value,
                showOutsideDays: props.content?.showOutsideDays !== false,
                fixedWeeks: !!props.content?.fixedWeeks,
                showWeekNumber: showWeekNumber.value,
                isoWeek: !!props.content?.isoWeek,
                locale: resolvedLocale.value,
                mode: resolvedMode.value,
                selectedKey: selectedKey.value,
                range: rangeValue.value,
                minDate: gridMinDate.value,
                maxDate: gridMaxDate.value,
                disabledKeys: gridDisabledKeys.value,
                disabledWeekdays: disabledWeekdays.value,
            })
        );

        const weekdayNames = computed(() => getWeekdayNames(resolvedLocale.value, weekStartsOn.value, 'short'));
        const weekdayLongNames = computed(() => getWeekdayNames(resolvedLocale.value, weekStartsOn.value, 'long'));
        const monthNames = computed(() => getMonthNames(resolvedLocale.value, 'long'));

        const yearOptions = computed(() => {
            const from = Math.round(Number(props.content?.fromYear) || 1970);
            const to = Math.round(Number(props.content?.toYear) || 2050);
            const start = Math.min(from, to);
            const end = Math.max(from, to);
            const years = [];
            // Hard cap: a bound formula could ask for year 1 to 9999 and freeze the tab.
            for (let year = start; year <= end && years.length < 400; year += 1) years.push(year);
            return years;
        });

        const handleMonthSelect = (monthIndex, event) => {
            const month = Number(event?.target?.value);
            if (!Number.isInteger(month)) return;
            const base = new Date(months.value[monthIndex].date);
            base.setMonth(month, 1);
            // The dropdown edits the month it sits under, so shift back to the anchor.
            setDisplayedMonth(addMonths(base, -monthIndex));
        };

        const handleYearSelect = (monthIndex, event) => {
            const year = Number(event?.target?.value);
            if (!Number.isInteger(year)) return;
            const base = new Date(months.value[monthIndex].date);
            base.setFullYear(year, base.getMonth(), 1);
            setDisplayedMonth(addMonths(base, -monthIndex));
        };

        // ─── Selection ───────────────────────────────────────────────────────────

        const canInteract = computed(() => !isEditing.value && !isDisabled.value && !isReadonly.value);

        const commitValue = next => {
            setValue(next);
            emit('trigger-event', { name: 'change', event: { value: next } });
        };

        const selectSingle = day => {
            // Clicking the selected day clears it, unless the field is required —
            // then there would be no way back to a valid state.
            const next = day.key === selectedKey.value && !props.content?.required ? null : day.key;
            commitValue(next);
        };

        const commitRange = next => {
            commitValue(next);
            if (!next.start || !next.end) return;
            emit('trigger-event', {
                name: 'rangeComplete',
                event: { value: next, dayCount: rangeDayCount(next) },
            });
        };

        const isRangeAllowed = range => {
            const count = rangeDayCount(range);
            if (minRange.value && count < minRange.value) return false;
            if (maxRange.value && count > maxRange.value) return false;
            return true;
        };

        /**
         * A click never throws the whole range away: it moves the edge it is nearest
         * to. Only the endpoints restart the selection — clicking one of a complete
         * range keeps it as the new start, clicking a lone start clears it.
         */
        const selectRange = day => {
            const { start, end } = rangeValue.value;

            if (!start) {
                commitRange({ start: day.key, end: null });
                return;
            }

            if (day.key === start && !end) {
                commitRange({ start: null, end: null });
                return;
            }

            if (day.key === start || day.key === end) {
                commitRange({ start: day.key, end: null });
                return;
            }

            // Before the start pushes the start back; anything else — inside the
            // range, or past its end — settles the end.
            const next = day.key < start ? { start: day.key, end: end || start } : { start, end: day.key };
            if (!isRangeAllowed(next)) return;
            commitRange(next);
        };

        const handleDaySelect = day => {
            if (!canInteract.value || day.isDisabled || day.isHidden) return;

            hasInteracted.value = true;
            focusedKey.value = day.key;
            emit('trigger-event', { name: 'dayClick', event: { value: day.key, date: day.key } });

            if (resolvedMode.value === 'range') selectRange(day);
            else selectSingle(day);
        };

        const cancelPendingRange = () => {
            if (!pendingStartKey.value) return false;
            commitValue({ start: null, end: null });
            return true;
        };

        // ─── Roving focus ────────────────────────────────────────────────────────
        // One tab stop per grid: the focused day, else the selected one, else today,
        // else the first day of the first displayed month.

        const focusedKey = ref(null);

        /** Every rendered cell, flattened — the lookup table for focus and tabindex. */
        const flatCells = computed(() => {
            const cells = [];
            for (const month of months.value) {
                for (const week of month.weeks) {
                    for (const day of week.days) {
                        cells.push({ cellKey: `${month.key}|${day.key}`, monthKey: month.key, day });
                    }
                }
            }
            return cells;
        });

        const activeDayKey = computed(() => {
            const candidates = [
                focusedKey.value,
                resolvedMode.value === 'range' ? rangeValue.value.start : selectedKey.value,
                toDateKey(new Date()),
            ];
            const flat = flatCells.value;
            for (const candidate of candidates) {
                if (candidate && flat.some(cell => cell.day.key === candidate && !cell.day.isHidden)) {
                    return candidate;
                }
            }
            const first = flat.find(cell => !cell.day.isHidden && !cell.day.isOutside);
            return first?.day.key ?? null;
        });

        /**
         * An outside day appears twice when several months are shown (31 August is
         * also a cell in September's grid), so the tab stop is a *cell* key, not a
         * date key — otherwise two buttons would claim `tabindex="0"`.
         */
        const activeCellKey = computed(() => {
            const key = activeDayKey.value;
            if (!key) return null;
            const cells = flatCells.value;
            const owned = cells.find(cell => cell.day.key === key && !cell.day.isOutside && !cell.day.isHidden);
            if (owned) return owned.cellKey;
            return cells.find(cell => cell.day.key === key && !cell.day.isHidden)?.cellKey ?? null;
        });

        // Vue calls an inline ref function with `null` when the node goes away, so the
        // map maintains itself. Never clear it wholesale — if Vue skips re-invoking
        // the refs, focus would silently stop working.
        const dayButtons = new Map();
        const registerDayButton = (el, cellKey) => {
            if (el) dayButtons.set(cellKey, el);
            else dayButtons.delete(cellKey);
        };

        const focusActiveDay = () => {
            nextTick(() => {
                const el = activeCellKey.value ? dayButtons.get(activeCellKey.value) : null;
                if (typeof el?.focus === 'function') el.focus();
            });
        };

        /** Bring `date` into view, then move the roving tab stop onto it. */
        const moveFocusTo = date => {
            if (!date) return;

            let target = date;
            if (minDate.value && isBefore(target, minDate.value)) target = minDate.value;
            if (maxDate.value && isAfter(target, maxDate.value)) target = maxDate.value;

            const firstVisible = startOfMonth(displayedMonth.value);
            const lastVisible = addDays(addMonths(firstVisible, monthCount.value), -1);

            if (isBefore(target, firstVisible)) setDisplayedMonth(startOfMonth(target));
            else if (isAfter(target, lastVisible)) {
                setDisplayedMonth(addMonths(startOfMonth(target), -(monthCount.value - 1)));
            }

            focusedKey.value = toDateKey(target);
            focusActiveDay();
        };

        /** Positive modulo — `-1 % 7` is `-1` in JS, which would walk the wrong way. */
        const mod = (value, modulus) => ((value % modulus) + modulus) % modulus;

        const handleKeydown = (day, event) => {
            const current = fromDateKey(day.key);
            if (!current) return;

            const shift = event?.shiftKey;
            let next = null;

            switch (event?.key) {
                case 'ArrowLeft':
                    next = addDays(current, -1);
                    break;
                case 'ArrowRight':
                    next = addDays(current, 1);
                    break;
                case 'ArrowUp':
                    next = addDays(current, -7);
                    break;
                case 'ArrowDown':
                    next = addDays(current, 7);
                    break;
                case 'Home':
                    next = addDays(current, -mod(current.getDay() - weekStartsOn.value, 7));
                    break;
                case 'End':
                    next = addDays(current, 6 - mod(current.getDay() - weekStartsOn.value, 7));
                    break;
                case 'PageUp':
                    next = shift ? addYears(current, -1) : addMonths(current, -1);
                    break;
                case 'PageDown':
                    next = shift ? addYears(current, 1) : addMonths(current, 1);
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    handleDaySelect(day);
                    return;
                case 'Escape':
                    if (cancelPendingRange()) event.preventDefault();
                    return;
                default:
                    return;
            }

            event.preventDefault();
            moveFocusTo(next);
        };

        // ─── Focus events ────────────────────────────────────────────────────────

        const isFocused = ref(false);
        let blurTimeout = null;

        const handleFocusIn = () => {
            if (blurTimeout) {
                clearTimeout(blurTimeout);
                blurTimeout = null;
            }
            if (!isFocused.value) {
                isFocused.value = true;
                emit('trigger-event', { name: 'focus' });
            }
        };

        // focusout fires before focusin on the next target, so "the calendar lost
        // focus" is only decided after the event pair settles.
        const handleFocusOut = () => {
            if (blurTimeout) clearTimeout(blurTimeout);
            blurTimeout = setTimeout(() => {
                blurTimeout = null;
                isFocused.value = false;
                emit('trigger-event', { name: 'blur' });
            }, 0);
        };

        onBeforeUnmount(() => {
            if (blurTimeout) clearTimeout(blurTimeout);
        });

        // ─── Icons ───────────────────────────────────────────────────────────────

        const { getIcon } = wwLib.useIcons();

        // `getIcon` resolves to whatever the server answered, not to null, when the
        // icon is missing — so the usual `(await getIcon(x)) || DEFAULT` is only safe
        // on a host that 404s. Self-hosted behind an SPA fallback, an unset icon asks
        // for `/icons/null.svg`, gets `index.html` back with a 200, and that 50 kB of
        // truthy HTML went straight into `v-html`: the whole app re-mounted inside the
        // nav button. Guard the empty code, and require the answer to look like an SVG.
        const loadIcon = async (code, fallback) => {
            if (!code) return fallback;
            const html = await getIcon(code);
            return /^\s*<svg[\s>]/i.test(html ?? '') ? html : fallback;
        };

        const previousIconHtml = ref(DEFAULT_CHEVRON_LEFT);
        const nextIconHtml = ref(DEFAULT_CHEVRON_RIGHT);

        // The prop is read synchronously as the call argument, before `loadIcon`
        // awaits, so watchEffect still tracks it.
        watchEffect(async () => {
            previousIconHtml.value = await loadIcon(props.content?.navIconPrev, DEFAULT_CHEVRON_LEFT);
        });
        watchEffect(async () => {
            nextIconHtml.value = await loadIcon(props.content?.navIconNext, DEFAULT_CHEVRON_RIGHT);
        });

        // ─── Form integration ────────────────────────────────────────────────────

        const fieldName = computed(() => props.content?.fieldName || props.wwElementState?.name);
        const validation = computed(() => props.content?.validation);
        const customValidation = computed(() => props.content?.customValidation);
        const required = computed(() => !!props.content?.required);

        const useForm = inject('_wwForm:useForm', () => {});
        useForm(
            variableValue,
            {
                fieldName,
                validation,
                customValidation,
                required,
                // A half-open range is not a filled field, which the default
                // truthiness check would happily accept.
                requiredValidation: value => {
                    const normalized = normalizeValue(value, resolvedMode.value);
                    if (resolvedMode.value === 'range') return !!(normalized?.start && normalized?.end);
                    return !isEmptyValue(normalized);
                },
                initialValue: initValue,
            },
            {
                elementState: props.wwElementState,
                emit,
                sidepanelFormPath: 'form',
                setValue,
            }
        );

        // ─── Actions ─────────────────────────────────────────────────────────────

        const setValueFromAction = value => {
            commitValue(normalizeValue(value, resolvedMode.value));
        };

        const resetValue = () => {
            hasInteracted.value = false;
            commitValue(initValue.value);
        };

        const clearValue = () => {
            hasInteracted.value = true;
            commitValue(resolvedMode.value === 'range' ? { start: null, end: null } : null);
        };

        const goToMonth = raw => {
            const parsed = fromDateKey(raw);
            if (!parsed) return;
            setDisplayedMonth(parsed);
        };

        const goToToday = () => setDisplayedMonth(new Date());

        const focusCalendar = () => focusActiveDay();

        // ─── Local context ───────────────────────────────────────────────────────

        const formatOptions = computed(() => ({
            style: props.content?.dateFormatStyle || 'medium',
            pattern: props.content?.customDateFormat || 'yyyy-MM-dd',
            locale: resolvedLocale.value,
        }));

        const localData = computed(() => ({
            value: variableValue.value ?? null,
            mode: resolvedMode.value,
            formatted:
                resolvedMode.value === 'range'
                    ? {
                          start: formatValue(rangeValue.value.start, formatOptions.value),
                          end: formatValue(rangeValue.value.end, formatOptions.value),
                      }
                    : formatValue(selectedKey.value, formatOptions.value),
            range: {
                start: rangeValue.value.start,
                end: rangeValue.value.end,
                dayCount: rangeDayCount(rangeValue.value),
                isComplete: !!(rangeValue.value.start && rangeValue.value.end),
            },
            displayedMonth: toDateKey(displayedMonth.value),
            today: toDateKey(new Date()),
            utils: {
                isEmpty: resolvedMode.value === 'range' ? isRangeEmpty(rangeValue.value) : !selectedKey.value,
                isInvalid: isInvalid.value,
                isDisabled: isDisabled.value,
                isReadonly: isReadonly.value,
                canGoPrevious: canGoPrevious.value,
                canGoNext: canGoNext.value,
            },
        }));

        const markdown = `### Calendar local information

#### value
The stored selection. A date string \`"2026-08-14"\` in single mode, an object \`{ start, end }\` in range mode.

#### formatted
The same selection rendered with the *Formatted value* setting. A string in single mode, \`{ start, end }\` in range mode.

#### range
- \`start\` / \`end\`: the range bounds as date strings
- \`dayCount\`: inclusive number of days, \`0\` while the range is open
- \`isComplete\`: both ends set

#### displayedMonth
The first day of the month currently shown, as \`"YYYY-MM-01"\`.

#### utils
\`isEmpty\`, \`isInvalid\`, \`isDisabled\`, \`isReadonly\`, \`canGoPrevious\`, \`canGoNext\`.

**Usage Example:**
\`\`\`
context.local.data?.['calendar']?.['range']?.['dayCount']
\`\`\`
`;

        wwLib.wwElement.useRegisterElementLocalContext('calendar', localData, {}, markdown);

        // ─── Labels ──────────────────────────────────────────────────────────────

        const previousLabel = computed(() => `Previous month`);
        const nextLabel = computed(() => `Next month`);
        const monthSelectLabel = computed(() => `Month`);
        const yearSelectLabel = computed(() => `Year`);
        const weekNumberLabel = computed(() => `Week`);

        return {
            // state
            months,
            weekdayNames,
            weekdayLongNames,
            monthNames,
            yearOptions,
            focusedKey,
            activeCellKey,

            // resolved settings
            resolvedMode,
            resolvedMonthDirection,
            captionLayout,
            showMonthDropdown,
            showYearDropdown,
            showWeekNumber,
            showNavigation,
            isFillWidth,
            columnCount,
            accessibleName,

            // flags
            isDisabled,
            isReadonly,
            isInvalid,
            isEditing,
            canGoPrevious,
            canGoNext,

            // icons
            previousIconHtml,
            nextIconHtml,
            chevronDownIcon: DEFAULT_CHEVRON_DOWN,

            // labels
            previousLabel,
            nextLabel,
            monthSelectLabel,
            yearSelectLabel,
            weekNumberLabel,

            // handlers
            registerDayButton,
            handleDaySelect,
            handleKeydown,
            handleFocusIn,
            handleFocusOut,
            handleMonthSelect,
            handleYearSelect,
            goToPreviousMonth,
            goToNextMonth,

            // Workflow actions. Returned from setup() under the exact names declared
            // in ww-config's `actions` array — that is what makes them callable.
            actionSetValue: setValueFromAction,
            actionResetValue: resetValue,
            actionClear: clearValue,
            actionGoToMonth: goToMonth,
            actionNextMonth: goToNextMonth,
            actionPreviousMonth: goToPreviousMonth,
            actionGoToToday: goToToday,
            actionFocus: focusCalendar,

            /* wwEditor:start */
            selectForm,
            /* wwEditor:end */
        };
    },
};
</script>

<style lang="scss" scoped>
.jp-cal {
    box-sizing: border-box;
    // The calendar hugs its grid instead of stretching, so a day cell is exactly
    // --jpc-cell-size at any container width.
    //
    // `max-content`, not `fit-content`. `fit-content` clamps itself to the available
    // space, which made the box narrower than the table it contains — the grid then spilled
    // out of its own background, and any fit-content ancestor sized itself to the shrunken
    // box rather than to the visible calendar. `max-content` never clamps, so the box is
    // always exactly the grid and parents measure the right thing. In a container narrower
    // than 7 × --jpc-cell-size the whole element overflows as one block, background
    // included, instead of coming apart.
    width: max-content;
    // Fill mode gives the width back to the container. It goes through a variable
    // rather than a plain `width: 100%` because of specificity: the style panel's own
    // width compiles to a rule on this same element, and `.jp-cal.is-fill` (0,3,0 with
    // the scope attribute) would outrank it and pin the calendar to the parent no
    // matter what the panel said. The config feeds `style.width` into --jpc-width so
    // the panel wins from inside our own rule instead of fighting it; unset, the
    // fallback is `100%`, which is what "fill container" means in a block parent and
    // also survives landing in a flex row, where `auto` would shrink-to-fit.
    &.is-fill {
        width: var(--jpc-width, 100%);
    }
    // No background / padding / border / border-radius here: those belong to WeWeb's
    // element style panel, and declaring them from the component fought it.
    font-family: var(--jpc-font-family, inherit);
    color: var(--jpc-day-color, #0A0A0A);
    -webkit-font-smoothing: antialiased;

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }

    &.is-disabled {
        opacity: 0.5;
    }

    &[aria-invalid='true'] {
        // Recolours whatever border the element panel set. With no border there, the
        // ring below is what carries the state.
        border-color: var(--jpc-invalid-border, #DC2626);
        box-shadow: 0 0 0 3px var(--jpc-invalid-ring, #DC262633);
    }
}

.jp-cal__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.jp-cal__months {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--jpc-month-gap, 16px);

    &.is-column {
        flex-direction: column;
    }
}

.jp-cal__month {
    display: flex;
    flex-direction: column;
    // Never stretch and never squeeze: each month is exactly as wide as its grid.
    flex: 0 0 auto;

    // In fill mode the months share the row instead. `min-width: 0` because a table
    // child gives the flex item an intrinsic minimum that would otherwise stop it
    // from shrinking below its natural grid width.
    .jp-cal.is-fill & {
        flex: 1 1 0;
        min-width: 0;
    }
}

/* ─── Caption & nav ─── */

.jp-cal__caption {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    // Reserve a nav button's width on both sides so a long caption never slides
    // underneath the absolutely positioned arrows.
    padding: 0 var(--jpc-cell-size, 32px);
    min-height: var(--jpc-cell-size, 32px);
}

.jp-cal__caption-label {
    font-size: var(--jpc-caption-size, 14px);
    font-weight: var(--jpc-caption-weight, 500);
    color: var(--jpc-caption-color, #0A0A0A);
    user-select: none;
    text-align: center;
}

.jp-cal__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--jpc-cell-size, 32px);
    height: var(--jpc-cell-size, 32px);
    padding: 0;
    border: none;
    background: var(--jpc-nav-bg, transparent);
    border-radius: var(--jpc-nav-radius, 6px);
    color: var(--jpc-nav-icon-color, #0A0A0A);
    cursor: pointer;
    transition: background-color 150ms ease, color 150ms ease;

    &--prev {
        left: 0;
    }
    &--next {
        right: 0;
    }

    &:hover:not(:disabled) {
        background: var(--jpc-nav-hover-bg, #F5F5F5);
        color: var(--jpc-nav-hover-icon, #0A0A0A);
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }

    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 var(--jpc-focus-width, 3px) var(--jpc-focus-color, #A1A1A180);
    }
}

.jp-cal__nav-icon {
    display: inline-flex;
    width: var(--jpc-nav-icon-size, 16px);
    height: var(--jpc-nav-icon-size, 16px);

    :deep(svg) {
        width: 100%;
        height: 100%;
        display: block;
    }
}

/* ─── Caption dropdowns ─── */

.jp-cal__dropdowns {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.jp-cal__dropdown-root {
    position: relative;
    display: inline-flex;
    border-radius: var(--jpc-cell-radius, 6px);
}

// The real <select> is a transparent overlay on top of the styled label, so the
// native picker opens on click while the visible text stays fully themable.
.jp-cal__dropdown {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    appearance: none;
    border: none;

    &:focus-visible + .jp-cal__dropdown-label {
        box-shadow: 0 0 0 var(--jpc-focus-width, 3px) var(--jpc-focus-color, #A1A1A180);
    }
}

.jp-cal__dropdown-label {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px;
    border-radius: var(--jpc-cell-radius, 6px);
    font-size: var(--jpc-caption-size, 14px);
    font-weight: var(--jpc-caption-weight, 500);
    color: var(--jpc-caption-color, #0A0A0A);
    user-select: none;
    white-space: nowrap;
}

.jp-cal__dropdown-chevron {
    display: inline-flex;
    width: 0.875em;
    height: 0.875em;
    color: var(--jpc-weekday-color, #737373);

    :deep(svg) {
        width: 100%;
        height: 100%;
        display: block;
    }
}

/* ─── Grid ─── */

.jp-cal__grid {
    // `auto` with a fixed layout resolves to the sum of the declared column widths —
    // exactly 7 (or 8, with week numbers) × --jpc-cell-size. `100%` would stretch those
    // columns to fill a wide container and blow the cell size up with them.
    width: auto;
    table-layout: fixed;
    border-collapse: separate;
    // Horizontal 0 keeps day cells touching, which is what makes the range track
    // continuous without shadcn's bridging pseudo-element.
    border-spacing: 0 var(--jpc-week-gap, 4px);

    // Fill mode: the table takes the container's width and `table-layout: fixed`
    // splits it into equal columns on its own, once the per-column widths below are
    // dropped. The floor keeps cells from collapsing to nothing in a cramped parent —
    // below it the grid overflows, which is the same failure mode as hug mode.
    .jp-cal.is-fill & {
        width: 100%;
        min-width: calc(var(--jpc-columns, 7) * var(--jpc-cell-size, 32px));
    }
}

.jp-cal__weekday {
    width: var(--jpc-cell-size, 32px);

    // Left unset so `table-layout: fixed` distributes the width evenly instead of
    // pinning every column to the cell size.
    .jp-cal.is-fill & {
        width: auto;
    }

    padding: 0;
    font-size: var(--jpc-weekday-size, 0.8rem);
    font-weight: var(--jpc-weekday-weight, 400);
    color: var(--jpc-weekday-color, #737373);
    user-select: none;
    text-align: center;
}

.jp-cal__week-number-header,
.jp-cal__week-number {
    width: var(--jpc-cell-size, 32px);
    padding: 0;

    .jp-cal.is-fill & {
        width: auto;
    }
}

.jp-cal__week-number-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    font-size: var(--jpc-week-number-size, 0.8rem);
    color: var(--jpc-week-number-color, #737373);
    user-select: none;
}

.jp-cal__day {
    // Only the width is declared. `aspect-ratio` is deliberately NOT set here: it does
    // not apply to internal table boxes, so a <td> would silently ignore it. The button
    // inside carries it, which is also where shadcn puts `aspect-square`.
    width: var(--jpc-cell-size, 32px);
    padding: 0;
    text-align: center;
    position: relative;
    // The range track is painted here and the pill on the button, so the two layers only
    // stay in register while they animate on the same clock: same properties, same
    // duration, same easing on both.
    //
    // The corner never morphs — `border-radius` is transitioned at `0s`, so it jumps.
    // What the delay buys is *when* it jumps: the rule is that a cell's shape may only
    // change while the track is invisible or unchanged. On the way in that is free, the
    // track fades up from transparent, so the track rule below overrides this delay to
    // zero. On the way out it is not: the track is still fully painted, and squaring the
    // corner immediately leaves a square block dissolving where a rounded end should be.
    // Holding the old radius for exactly one fade keeps the band's ends rounded until
    // there is nothing left to see, then snaps.
    --track-fade: 150ms;
    transition: background-color var(--track-fade) ease, border-radius 0s linear var(--track-fade);

    .jp-cal.is-fill & {
        width: auto;
    }
}

.jp-cal__day-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    // The column width is decided by the table (7 equal columns of whatever width the
    // calendar has); the height follows it. That keeps every day square at any size
    // instead of pinning the height to --jpc-cell-size and letting wide containers
    // stretch the cells into rectangles.
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: var(--jpc-cell-radius, 6px);
    font-family: inherit;
    font-size: var(--jpc-day-size, 14px);
    font-weight: var(--jpc-day-weight, 400);
    line-height: 1;
    color: var(--jpc-day-color, #0A0A0A);
    cursor: pointer;
    user-select: none;
    transition: background-color 150ms ease, color 150ms ease;

    &:hover {
        background: var(--jpc-day-hover-bg, #F5F5F5);
        color: var(--jpc-day-hover-color, #0A0A0A);
    }

    &:focus-visible {
        outline: none;
        // Sits above neighbouring cells so the ring is never clipped by the range track.
        position: relative;
        z-index: 2;
        box-shadow: 0 0 0 var(--jpc-focus-width, 3px) var(--jpc-focus-color, #A1A1A180);
    }
}

/* ─── Day states ─── */
/* Order matters: today → selected → range track → outside/disabled. */

.jp-cal__day[data-today] .jp-cal__day-btn {
    background: var(--jpc-today-bg, #F5F5F5);
    color: var(--jpc-today-color, #0A0A0A);
    font-weight: var(--jpc-today-weight, 500);
}

// Range endpoints are selected days too (`isSelected` covers start, middle and end), so
// this one rule paints the dark pill in both modes. The track rules below only have to
// undo it for the middle days.
// No `:hover` here. This selector already outranks the generic `.jp-cal__day-btn:hover`
// (0,4,0 against 0,3,0 once the scope attribute is counted), so a selected day keeps its
// pill on hover without a rule saying so. The hover it used to carry only ever restated
// the same two colors, and the fade into it desynchronised from the cell underneath.
.jp-cal__day[data-selected] .jp-cal__day-btn {
    background: var(--jpc-selected-bg, #171717);
    color: var(--jpc-selected-color, #FAFAFA);
}

// The track lives on the cell, the pill on the button — two layers, exactly like
// the shadcn original, minus the pseudo-element.
.jp-cal__day[data-range-start]:not([data-range-open]),
.jp-cal__day[data-range-middle],
.jp-cal__day[data-range-end]:not([data-range-open]) {
    background: var(--jpc-range-track-bg, #F5F5F5);
    // Becoming a track day, so the corner is either fading up from transparent or the
    // track is staying put underneath it. Nothing to hide: drop the hold and snap now.
    // An open start is excluded on purpose — it carries no track, so it leaves by the
    // rule above and keeps its shape on the way out like any other exit.
    transition: background-color var(--track-fade) ease, border-radius 0s;
}

.jp-cal__day[data-range-start]:not([data-range-open]) {
    border-top-left-radius: var(--jpc-cell-radius, 6px);
    border-bottom-left-radius: var(--jpc-cell-radius, 6px);
}

.jp-cal__day[data-range-end]:not([data-range-open]) {
    border-top-right-radius: var(--jpc-cell-radius, 6px);
    border-bottom-right-radius: var(--jpc-cell-radius, 6px);
}

// One colour change must not animate either: a day entering the track. That day is always
// a demoted endpoint — selectRange moves the nearest edge rather than rebuilding, so
// extending a range past its own end keeps the old end and swallows it — and its pill
// would dissolve in place, a full-contrast crossfade on background and text at once. It
// smears, and no easing fixes that; the pill has to be gone the moment it stops being an
// endpoint.
//
// `transition: none` here is what makes the snap one-directional. CSS resolves a
// transition from the after-change style, so becoming a middle day snaps, while leaving
// the state — promoted back to a pill, or dropped off the track entirely — still reads
// its transition from the rules above and fades. The cell is deliberately left out: the
// track keeps fading, so the band grows and shrinks smoothly. Only the pill is cut.
.jp-cal__day[data-range-middle] .jp-cal__day-btn {
    background: transparent;
    color: var(--jpc-range-track-color, #0A0A0A);
    border-radius: 0;
    transition: none;

    // Restated so a hover themed away from the track color still fades in. Its fade out
    // is the snap above, which is the same asymmetry and invisible at hover contrast.
    &:hover {
        background: var(--jpc-day-hover-bg, #F5F5F5);
        color: var(--jpc-day-hover-color, #0A0A0A);
        border-radius: var(--jpc-cell-radius, 6px);
        transition: background-color 150ms ease, color 150ms ease;
    }
}

// A range that wraps to the next line still reads as one band: round it off at the
// row edges. Declared after the range rules so it wins over `border-radius: 0`.
.jp-cal__day.is-row-start {
    border-top-left-radius: var(--jpc-cell-radius, 6px);
    border-bottom-left-radius: var(--jpc-cell-radius, 6px);
}

.jp-cal__day.is-row-end {
    border-top-right-radius: var(--jpc-cell-radius, 6px);
    border-bottom-right-radius: var(--jpc-cell-radius, 6px);
}

.jp-cal__day[data-outside] .jp-cal__day-btn {
    color: var(--jpc-outside-color, #A3A3A3);
}

.jp-cal__day[data-disabled] .jp-cal__day-btn {
    color: var(--jpc-disabled-color, #A3A3A3);
    opacity: var(--jpc-disabled-opacity, 0.5);
    cursor: not-allowed;

    &:hover {
        background: transparent;
        color: var(--jpc-disabled-color, #A3A3A3);
    }
}

.jp-cal.is-readonly .jp-cal__day-btn,
.jp-cal.is-editing .jp-cal__day-btn {
    cursor: default;
}

.jp-cal.is-readonly .jp-cal__day:not([data-selected]) .jp-cal__day-btn:hover {
    background: transparent;
    color: var(--jpc-day-color, #0A0A0A);
}

/* wwEditor:start */
// On the canvas the day buttons are not really disabled (a disabled control suppresses
// the click the editor needs to select the element), so the cursor hint comes from the
// stand-in attribute instead of `:disabled`.
.jp-cal[data-ww-disabled='true'] .jp-cal__day-btn {
    cursor: not-allowed;
}
/* wwEditor:end */

@media (prefers-reduced-motion: reduce) {
    // Zeroing the knob is what silences the cell: the track rule sets its own transition
    // at a higher specificity than this block can reach, but it reads the duration from
    // the same variable, so both the fade and the radius hold collapse to nothing.
    .jp-cal__day {
        --track-fade: 0s;
    }

    .jp-cal__day-btn,
    .jp-cal__nav {
        transition: none;
    }
}
</style>
