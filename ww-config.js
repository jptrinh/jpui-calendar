// The exact option list WeWeb's own components use for a font weight (ww-rich-text,
// ww-button-multilang, ww-input-otp and others): numeric values across the full 100–900
// range, a null "Default" that falls through to the SCSS fallback, and "<number> - <Name>"
// labels. Shared rather than repeated so the four weight properties cannot drift apart.
const FONT_WEIGHT_OPTIONS = [
    { value: null, label: { en: 'Default' } },
    { value: 100, label: { en: '100 - Thin' } },
    { value: 200, label: { en: '200 - Extra Light' } },
    { value: 300, label: { en: '300 - Light' } },
    { value: 400, label: { en: '400 - Normal' } },
    { value: 500, label: { en: '500 - Medium' } },
    { value: 600, label: { en: '600 - Semi Bold' } },
    { value: 700, label: { en: '700 - Bold' } },
    { value: 800, label: { en: '800 - Extra Bold' } },
    { value: 900, label: { en: '900 - Black' } },
];

export default {
    editor: {
        label: { en: 'Calendar' },
        icon: 'calendar',

        // Ordered the way jpui-radiogroup orders its own settings: what the field holds
        // first, then how it looks, then language, then state and form. Locale and format
        // used to sit between the value and the display settings, and the constraints that
        // govern the value were stranded eleven rows below it.
        // Ordered the way jpui-radiogroup orders its own settings: what the field holds
        // first, then how it looks, then language, then state and form. Locale and format
        // used to sit between the value and the display settings, and the constraints that
        // govern the value were stranded eleven rows below it.
        customSettingsPropertiesOrder: [
            // ── The value, and the view it opens on ──────────────────────────
            'mode',
            'initialValue',
            // Which month opens and how many follow it — one decision, one row.
            // `monthDirection` joins as a third column only once there are 2+ months.
            ['defaultMonth', 'numberOfMonths', 'monthDirection'],

            // ── Which days are pickable ──────────────────────────────────────
            ['minDate', 'maxDate', 'disabledDates', 'disabledDaysOfWeek'],
            'mappingDisabledDate',
            // Range length is a property of the selection, not of which days exist,
            // and it only appears in range mode — so it follows rather than joins.
            ['minRange', 'maxRange'],

            // ── How the grid looks ───────────────────────────────────────────
            // captionLayout and hideNavigation drive the same UI part, the caption bar.
            ['captionLayout', 'hideNavigation'],
            ['fromYear', 'toYear'],
            // The three grid toggles read as one decision, so they share a row.
            // `isoWeek` follows on its own: it only exists once week numbers are on.
            ['showOutsideDays', 'fixedWeeks', 'showWeekNumber'],
            'isoWeek',

            // ── Language & formatting ────────────────────────────────────────
            ['locale', 'weekStartsOn', 'dateFormatStyle'],
            // Full width on its own row: a date-fns pattern is long and only shows up
            // once "Custom pattern…" is picked, so it costs nothing by default.
            'customDateFormat',

            // ── State, accessibility, form ───────────────────────────────────
            // All four behaviour flags on one row — they are read together when
            // wiring a form, and splitting them across two rows hid that.
            ['disabled', 'readonly', 'required', 'invalid'],
            'ariaLabel',
            'formInfobox',
            ['fieldName', 'customValidation', 'validation'],
        ],
        customStylePropertiesOrder: [
            {
                label: 'Calendar',
                isCollapsible: true,
                properties: ['widthMode', 'calendarFontFamily', 'monthGap'],
            },
            {
                label: 'Cell',
                isCollapsible: true,
                properties: ['cellSize', 'minCellSize', 'cellRadius', 'weekGap'],
            },
            {
                label: 'Caption & nav',
                isCollapsible: true,
                properties: [
                    'captionFontSize',
                    'captionFontWeight',
                    'captionColor',
                    'navIconPrev',
                    'navIconNext',
                    'navIconSize',
                    'navIconColor',
                    'navBgColor',
                    'navHoverBgColor',
                    'navHoverIconColor',
                    'navBorderRadius',
                ],
            },
            {
                label: 'Weekday header',
                isCollapsible: true,
                properties: ['weekdayFontSize', 'weekdayFontWeight', 'weekdayColor'],
            },
            {
                label: 'Day',
                isCollapsible: true,
                properties: ['dayFontSize', 'dayFontWeight', 'dayColor', 'dayHoverBgColor', 'dayHoverColor'],
            },
            {
                label: 'Selected',
                isCollapsible: true,
                properties: ['selectedBgColor', 'selectedColor', 'selectedHoverBgColor'],
            },
            {
                label: 'Today',
                isCollapsible: true,
                properties: ['todayBgColor', 'todayColor', 'todayFontWeight'],
            },
            {
                label: 'Range',
                isCollapsible: true,
                properties: ['rangeEndpointBgColor', 'rangeEndpointColor', 'rangeMiddleBgColor', 'rangeMiddleColor'],
            },
            {
                label: 'Outside & disabled',
                isCollapsible: true,
                properties: ['outsideDayColor', 'disabledDayColor', 'disabledDayOpacity'],
            },
            {
                label: 'Week number',
                isCollapsible: true,
                properties: ['weekNumberColor', 'weekNumberFontSize'],
            },
            {
                label: 'Focus-visible',
                isCollapsible: true,
                properties: ['focusRingColor', 'focusRingWidth'],
            },
            {
                label: 'Invalid',
                isCollapsible: true,
                properties: ['invalidBorderColor', 'invalidRingColor'],
            },
        ],
    },

    options: {
        autoByContent: true,
        displayAllowedValues: ['block', 'inline-block', 'flex', 'inline-flex'],
    },

    /**
     * Style-panel properties are compiled into real CSS rules by WeWeb, one per
     * breakpoint / state / design-system class. Emitting these from an inline
     * `:style` instead would ship only the base value and silently drop every
     * variant — which is exactly what per-state styling needs.
     *
     * The other half of the contract lives in the scoped SCSS: each one is read as
     * `var(--jpc-x, <default>)`, so the component still looks right while serving
     * locally, before the compiler has run.
     */
    css({ content, style }) {
        return [
            /* Calendar */
            // Background, padding, border and radius are deliberately absent: WeWeb's own
            // element style panel already owns those on the root, and declaring them here
            // put two competing sources on the same properties.
            // Only consumed in fill mode, where the root reads `width: var(--jpc-width, 100%)`.
            // Routing the panel's own width through a variable keeps it winning over the
            // component's rule instead of losing a specificity fight with it.
            { property: '--jpc-width', value: content.widthMode === 'fill' ? style?.width : undefined },
            { property: '--jpc-font-family', value: content.calendarFontFamily },
            { property: '--jpc-month-gap', value: content.monthGap },
            /* Cell */
            // One variable, two meanings: the exact cell size when the calendar hugs its
            // grid, the floor it refuses to shrink past when it fills its container. Only
            // one of the two properties is visible at a time, so they never both apply.
            {
                property: '--jpc-cell-size',
                value: content.widthMode === 'fill' ? content.minCellSize : content.cellSize,
            },
            { property: '--jpc-cell-radius', value: content.cellRadius },
            { property: '--jpc-week-gap', value: content.weekGap },
            /* Caption & nav */
            { property: '--jpc-caption-size', value: content.captionFontSize },
            { property: '--jpc-caption-weight', value: content.captionFontWeight },
            { property: '--jpc-caption-color', value: content.captionColor },
            { property: '--jpc-nav-icon-size', value: content.navIconSize },
            { property: '--jpc-nav-icon-color', value: content.navIconColor },
            { property: '--jpc-nav-bg', value: content.navBgColor },
            { property: '--jpc-nav-hover-bg', value: content.navHoverBgColor },
            { property: '--jpc-nav-hover-icon', value: content.navHoverIconColor },
            { property: '--jpc-nav-radius', value: content.navBorderRadius },
            /* Weekday header */
            { property: '--jpc-weekday-size', value: content.weekdayFontSize },
            { property: '--jpc-weekday-weight', value: content.weekdayFontWeight },
            { property: '--jpc-weekday-color', value: content.weekdayColor },
            /* Day */
            { property: '--jpc-day-size', value: content.dayFontSize },
            { property: '--jpc-day-weight', value: content.dayFontWeight },
            { property: '--jpc-day-color', value: content.dayColor },
            { property: '--jpc-day-hover-bg', value: content.dayHoverBgColor },
            { property: '--jpc-day-hover-color', value: content.dayHoverColor },
            /* Selected */
            { property: '--jpc-selected-bg', value: content.selectedBgColor },
            { property: '--jpc-selected-color', value: content.selectedColor },
            { property: '--jpc-selected-hover-bg', value: content.selectedHoverBgColor },
            /* Today */
            { property: '--jpc-today-bg', value: content.todayBgColor },
            { property: '--jpc-today-color', value: content.todayColor },
            { property: '--jpc-today-weight', value: content.todayFontWeight },
            /* Range */
            { property: '--jpc-range-endpoint-bg', value: content.rangeEndpointBgColor },
            { property: '--jpc-range-endpoint-color', value: content.rangeEndpointColor },
            { property: '--jpc-range-track-bg', value: content.rangeMiddleBgColor },
            { property: '--jpc-range-track-color', value: content.rangeMiddleColor },
            /* Outside & disabled */
            { property: '--jpc-outside-color', value: content.outsideDayColor },
            { property: '--jpc-disabled-color', value: content.disabledDayColor },
            { property: '--jpc-disabled-opacity', value: content.disabledDayOpacity },
            /* Week number */
            { property: '--jpc-week-number-color', value: content.weekNumberColor },
            { property: '--jpc-week-number-size', value: content.weekNumberFontSize },
            /* Focus-visible */
            { property: '--jpc-focus-color', value: content.focusRingColor },
            { property: '--jpc-focus-width', value: content.focusRingWidth },
            /* Invalid */
            { property: '--jpc-invalid-border', value: content.invalidBorderColor },
            { property: '--jpc-invalid-ring', value: content.invalidRingColor },
        ];
    },

    // Selector-based states (the current API — WeWeb generates the CSS, the component
    // emits nothing). The root is a plain <div>, so none of these has a pseudo-class of
    // its own:
    //   - focus lands on a day <button> inside → `:has()`
    //   - disabled / readonly / invalid are applicative → the root carries the matching
    //     ARIA attribute, which drives the style *and* announces the state.
    // `data-ww-disabled` is the editing-mode stand-in: the real `disabled` attribute is
    // dropped on the canvas so it cannot swallow the editor's selection click.
    states: [
        { label: 'focus-visible', selectors: ['&:focus-visible', '&:has(:focus-visible)'] },
        { label: 'disabled', selectors: ['&[aria-disabled="true"]', '&[data-ww-disabled="true"]'] },
        { label: 'readonly', selector: '&[aria-readonly="true"]' },
        { label: 'invalid', selector: '&[aria-invalid="true"]' },
    ],

    actions: [
        {
            label: { en: 'Set value' },
            action: 'actionSetValue',
            args: [{ name: 'Value', type: 'any', required: true }],
        },
        { label: { en: 'Reset value' }, action: 'actionResetValue', args: [] },
        { label: { en: 'Clear value' }, action: 'actionClear', args: [] },
        {
            label: { en: 'Go to month' },
            action: 'actionGoToMonth',
            args: [{ name: 'Month', type: 'string', required: true }],
        },
        { label: { en: 'Next month' }, action: 'actionNextMonth', args: [] },
        { label: { en: 'Previous month' }, action: 'actionPreviousMonth', args: [] },
        { label: { en: 'Go to today' }, action: 'actionGoToToday', args: [] },
        { label: { en: 'Focus' }, action: 'actionFocus', args: [] },
    ],

    triggerEvents: [
        { name: 'change', label: { en: 'On change' }, event: { value: null }, default: true },
        { name: 'initValueChange', label: { en: 'On init value change' }, event: { value: null } },
        { name: 'dayClick', label: { en: 'On day click' }, event: { value: '', date: null } },
        { name: 'rangeComplete', label: { en: 'On range complete' }, event: { value: { start: '', end: '' }, dayCount: 0 } },
        { name: 'monthChange', label: { en: 'On month change' }, event: { value: '' } },
        { name: 'focus', label: { en: 'On focus' }, event: null },
        { name: 'blur', label: { en: 'On blur' }, event: null },
    ],

    properties: {
        /* ══════════════════════════ SETTINGS ══════════════════════════ */

        mode: {
            label: { en: 'Selection mode' },
            type: 'TextSelect',
            section: 'settings',
            options: {
                options: [
                    { value: 'single', label: 'Single date' },
                    { value: 'range', label: 'Date range' },
                ],
            },
            defaultValue: 'single',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'The selection mode: `"single" | "range"`',
            },
            propertyHelp: {
                tooltip:
                    'Single stores one date string (`"2026-08-14"`). Range stores an object (`{ start, end }`). Switching mode keeps the date — a range collapses to its start.',
            },
            /* wwEditor:end */
        },

        initialValue: {
            label: { en: 'Initial value' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: '',
            /* wwEditor:start */
            bindingValidation: {
                type: 'any',
                tooltip:
                    'In single mode a date: `"2026-08-14"`, an ISO datetime or a Date.\n\nIn range mode an object `{ start, end }` (`{ from, to }` and `[start, end]` are also accepted).',
            },
            propertyHelp: {
                tooltip: 'The value the calendar starts on, and the value a form reset restores.',
            },
            /* wwEditor:end */
        },

        locale: {
            label: { en: 'Locale' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: 'en-US',
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'A BCP-47 language tag: `"en-US" | "fr-FR" | "es-ES" | "ja-JP"`',
            },
            propertyHelp: {
                tooltip:
                    'Drives month and weekday names. Leave empty to follow the browser. An unknown tag falls back to the browser rather than breaking the calendar.',
            },
            /* wwEditor:end */
        },

        weekStartsOn: {
            label: { en: 'Week starts on' },
            type: 'TextSelect',
            section: 'settings',
            options: {
                options: [
                    { value: '0', label: 'Sunday' },
                    { value: '1', label: 'Monday' },
                    { value: '2', label: 'Tuesday' },
                    { value: '3', label: 'Wednesday' },
                    { value: '4', label: 'Thursday' },
                    { value: '5', label: 'Friday' },
                    { value: '6', label: 'Saturday' },
                ],
            },
            defaultValue: '0',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'The first column of the grid, `"0"` (Sunday) through `"6"` (Saturday).',
            },
            /* wwEditor:end */
        },

        dateFormatStyle: {
            label: { en: 'Formatted value' },
            type: 'TextSelect',
            section: 'settings',
            options: {
                options: [
                    { value: 'full', label: 'Full — Friday, August 14, 2026' },
                    { value: 'long', label: 'Long — August 14, 2026' },
                    { value: 'medium', label: 'Medium — Aug 14, 2026' },
                    { value: 'short', label: 'Short — 8/14/26' },
                    { value: 'iso', label: 'ISO — 2026-08-14' },
                    { value: 'custom', label: 'Custom pattern…' },
                ],
            },
            defaultValue: 'medium',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'Valid values: `"full" | "long" | "medium" | "short" | "iso" | "custom"`',
            },
            propertyHelp: {
                tooltip:
                    'Only affects the read-only `formatted` string exposed in local context. The stored value is always an ISO date. The presets follow the Locale property; a custom pattern does not.',
            },
            /* wwEditor:end */
        },

        customDateFormat: {
            label: { en: 'Custom pattern' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: 'dd/MM/yyyy',
            hidden: content => content?.dateFormatStyle !== 'custom',
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'A date-fns pattern: `"dd/MM/yyyy" | "MMM d, yyyy" | "yyyy-MM-dd"`',
            },
            propertyHelp: {
                tooltip:
                    'A date-fns format pattern. Month and day names in a custom pattern always render in English — use one of the presets if you need them localized.',
            },
            /* wwEditor:end */
        },

        defaultMonth: {
            label: { en: 'Default month' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: '',
            /* wwEditor:start */
            bindingValidation: {
                type: 'any',
                tooltip: 'Any date inside the month to open on: `"2026-08-01"`',
            },
            propertyHelp: {
                tooltip:
                    'The month shown on first render. Leave empty to open on the selected value, or on the current month when there is none.',
            },
            /* wwEditor:end */
        },

        numberOfMonths: {
            label: { en: 'Months shown' },
            type: 'Number',
            section: 'settings',
            options: { min: 1, max: 12, step: 1 },
            defaultValue: 1,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'number', tooltip: 'How many months to render side by side, 1 to 12.' },
            /* wwEditor:end */
        },

        monthDirection: {
            label: { en: 'Months layout' },
            type: 'TextSelect',
            section: 'settings',
            options: {
                options: [
                    { value: 'row', label: 'Horizontal' },
                    { value: 'column', label: 'Vertical' },
                ],
            },
            defaultValue: 'row',
            bindable: true,
            hidden: content => (Number(content?.numberOfMonths) || 1) < 2,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'Valid values: `"row" | "column"`' },
            /* wwEditor:end */
        },

        captionLayout: {
            label: { en: 'Caption' },
            type: 'TextSelect',
            section: 'settings',
            options: {
                options: [
                    { value: 'label', label: 'Label' },
                    { value: 'dropdown', label: 'Month + year dropdowns' },
                    { value: 'dropdown-months', label: 'Month dropdown' },
                    { value: 'dropdown-years', label: 'Year dropdown' },
                ],
            },
            defaultValue: 'label',
            bindable: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'Valid values: `"label" | "dropdown" | "dropdown-months" | "dropdown-years"`',
            },
            propertyHelp: { tooltip: 'Turns the month/year caption into native select controls for faster navigation.' },
            /* wwEditor:end */
        },

        fromYear: {
            label: { en: 'First year' },
            type: 'Number',
            section: 'settings',
            options: { min: 1, max: 9999, step: 1 },
            defaultValue: 1970,
            bindable: true,
            hidden: content => !['dropdown', 'dropdown-years'].includes(content?.captionLayout),
            /* wwEditor:start */
            bindingValidation: { type: 'number', tooltip: 'The earliest year offered by the year dropdown.' },
            /* wwEditor:end */
        },

        toYear: {
            label: { en: 'Last year' },
            type: 'Number',
            section: 'settings',
            options: { min: 1, max: 9999, step: 1 },
            defaultValue: 2050,
            bindable: true,
            hidden: content => !['dropdown', 'dropdown-years'].includes(content?.captionLayout),
            /* wwEditor:start */
            bindingValidation: { type: 'number', tooltip: 'The latest year offered by the year dropdown.' },
            /* wwEditor:end */
        },

        showOutsideDays: {
            label: { en: 'Show outside days' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: { tooltip: 'Fills the leading and trailing cells with the neighbouring months’ days.' },
            /* wwEditor:end */
        },

        fixedWeeks: {
            label: { en: 'Fixed weeks' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: {
                tooltip: 'Always renders 6 week rows so the calendar keeps a constant height as the user navigates.',
            },
            /* wwEditor:end */
        },

        showWeekNumber: {
            label: { en: 'Show week numbers' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            /* wwEditor:end */
        },

        isoWeek: {
            label: { en: 'ISO week numbers' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            hidden: content => !content?.showWeekNumber,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: { tooltip: 'ISO-8601 numbering (weeks start Monday, week 1 contains the first Thursday).' },
            /* wwEditor:end */
        },

        hideNavigation: {
            label: { en: 'Hide navigation' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: {
                tooltip: 'Removes the previous/next arrows. Keyboard navigation still moves between months.',
            },
            /* wwEditor:end */
        },

        minDate: {
            label: { en: 'Min date' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: '',
            /* wwEditor:start */
            bindingValidation: { type: 'any', tooltip: 'The earliest selectable date: `"2026-01-01"`' },
            /* wwEditor:end */
        },

        maxDate: {
            label: { en: 'Max date' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: '',
            /* wwEditor:start */
            bindingValidation: { type: 'any', tooltip: 'The latest selectable date: `"2026-12-31"`' },
            /* wwEditor:end */
        },

        disabledDates: {
            label: { en: 'Disabled dates' },
            type: 'Array',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            options: {
                expandable: true,
                getItemLabel(item) {
                    if (typeof item === 'string') return item || 'Date';
                    return item?.date || 'Date';
                },
                item: {
                    type: 'Object',
                    defaultValue: { date: '' },
                    options: {
                        item: {
                            date: { label: { en: 'Date' }, type: 'Text' },
                        },
                    },
                },
            },
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip:
                    'An array of dates to block: `["2026-08-14", "2026-08-15"]`, or a collection mapped with the formula below.',
            },
            /* wwEditor:end */
        },

        mappingDisabledDate: {
            label: { en: 'Disabled date field' },
            type: 'Formula',
            section: 'settings',
            options: content => ({
                template: Array.isArray(content?.disabledDates) && content.disabledDates.length ? content.disabledDates[0] : null,
            }),
            defaultValue: { type: 'f', code: "context.mapping?.['date']" },
            hidden: (content, sidepanelContent, boundProps) =>
                !Array.isArray(content?.disabledDates) || !content?.disabledDates?.length || !boundProps?.disabledDates,
            /* wwEditor:start */
            propertyHelp: {
                tooltip: 'Formula resolving the date of each item in Disabled dates. Runs once per item.',
            },
            /* wwEditor:end */
        },

        disabledDaysOfWeek: {
            label: { en: 'Disabled weekdays' },
            type: 'Array',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            options: {
                expandable: true,
                getItemLabel(item) {
                    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const index = Number(typeof item === 'object' ? item?.day : item);
                    return names[index] ?? 'Weekday';
                },
                item: {
                    type: 'Object',
                    defaultValue: { day: 0 },
                    options: {
                        item: {
                            day: {
                                label: { en: 'Weekday' },
                                type: 'TextSelect',
                                options: {
                                    options: [
                                        { value: 0, label: 'Sunday' },
                                        { value: 1, label: 'Monday' },
                                        { value: 2, label: 'Tuesday' },
                                        { value: 3, label: 'Wednesday' },
                                        { value: 4, label: 'Thursday' },
                                        { value: 5, label: 'Friday' },
                                        { value: 6, label: 'Saturday' },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'An array of weekday indexes to block, 0 = Sunday: `[0, 6]` blocks every weekend.',
            },
            /* wwEditor:end */
        },

        minRange: {
            label: { en: 'Min range length' },
            type: 'Number',
            section: 'settings',
            options: { min: 0, max: 365, step: 1 },
            defaultValue: 0,
            bindable: true,
            hidden: content => content?.mode !== 'range',
            /* wwEditor:start */
            bindingValidation: { type: 'number', tooltip: 'Minimum number of days in a range, inclusive. 0 = no minimum.' },
            /* wwEditor:end */
        },

        maxRange: {
            label: { en: 'Max range length' },
            type: 'Number',
            section: 'settings',
            options: { min: 0, max: 365, step: 1 },
            defaultValue: 0,
            bindable: true,
            hidden: content => content?.mode !== 'range',
            /* wwEditor:start */
            bindingValidation: { type: 'number', tooltip: 'Maximum number of days in a range, inclusive. 0 = no maximum.' },
            propertyHelp: {
                tooltip: 'Once a start date is picked, days that would stretch the range beyond this many days are greyed out.',
            },
            /* wwEditor:end */
        },

        disabled: {
            label: { en: 'Disabled' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            states: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: { tooltip: 'Blocks selection and dims the calendar, adding the `disabled` state.' },
            /* wwEditor:end */
        },

        readonly: {
            label: { en: 'Read-only' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            states: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: {
                tooltip: 'Blocks selection but keeps full opacity and keyboard focus, so the value stays readable.',
            },
            /* wwEditor:end */
        },

        required: {
            label: { en: 'Required' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            states: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: {
                tooltip: 'A range counts as filled only once both ends are set.',
            },
            /* wwEditor:end */
        },

        invalid: {
            label: { en: 'Invalid' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            states: true,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            propertyHelp: { tooltip: 'Forces the invalid state. Bind it to a server-side error.' },
            /* wwEditor:end */
        },

        ariaLabel: {
            label: { en: 'Aria label' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: 'Calendar',
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'The accessible name announced for the date grid.' },
            /* wwEditor:end */
        },

        /* ─── Form integration ─── */

        form: { editorOnly: true, hidden: true, defaultValue: false },

        /* wwEditor:start */
        formInfobox: {
            type: 'InfoBox',
            section: 'settings',
            options: (_, sidePanelContent) => ({
                variant: sidePanelContent.form?.name ? 'success' : 'warning',
                icon: 'pencil',
                title: sidePanelContent.form?.name || 'Unnamed form',
                content: !sidePanelContent.form?.name && 'Give your form a meaningful name.',
                cta: { label: 'Select form', action: 'selectForm' },
            }),
            hidden: (_, sidePanelContent) => !sidePanelContent.form?.uid,
        },
        /* wwEditor:end */

        fieldName: {
            label: { en: 'Field name' },
            type: 'Text',
            section: 'settings',
            defaultValue: '',
            bindable: true,
            states: true,
            responsive: true,
            hidden: (_, sidePanelContent) => !sidePanelContent.form?.uid,
            /* wwEditor:start */
            bindingValidation: { type: 'string', tooltip: 'The field name used in the form submission.' },
            /* wwEditor:end */
        },

        customValidation: {
            label: { en: 'Custom validation' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: false,
            bindable: true,
            states: true,
            responsive: true,
            hidden: (_, sidePanelContent) => !sidePanelContent.form?.uid,
            /* wwEditor:start */
            bindingValidation: { type: 'boolean', tooltip: 'A boolean value: \n\n`true` or `false`' },
            /* wwEditor:end */
        },

        validation: {
            label: { en: 'Validation' },
            type: 'Formula',
            section: 'settings',
            defaultValue: '',
            bindable: false,
            states: true,
            responsive: true,
            hidden: (content, sidePanelContent) => !sidePanelContent.form?.uid || !content?.customValidation,
        },

        /* ══════════════════════════ STYLE ══════════════════════════ */

        /* ─── Calendar ─── */

        widthMode: {
            label: { en: 'Width mode' },
            type: 'TextSelect',
            section: 'style',
            options: {
                options: [
                    { value: 'hug', label: 'Hug cells' },
                    { value: 'fill', label: 'Fill container' },
                ],
            },
            defaultValue: 'hug',
            bindable: true,
            responsive: true,
            states: true,
            /* wwEditor:start */
            propertyHelp: {
                tooltip:
                    'Hug cells: the calendar is exactly its grid — 7 × the cell size (8 × with week numbers) — and any width set in the style panel is ignored. Fill container: the calendar takes the width you give it here and the cells divide it evenly, staying square.',
            },
            bindingValidation: {
                type: 'string',
                tooltip: "A width mode: `'hug'` or `'fill'`",
            },
            /* wwEditor:end */
        },

        calendarFontFamily: {
            label: { en: 'Font family' },
            type: 'FontFamily',
            section: 'style',
            defaultValue: '',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
        },

        monthGap: {
            label: { en: 'Gap between months' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 120 },
                    { value: 'rem', label: 'rem', min: 0, max: 8 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '16px',
            bindable: true,
            responsive: true,
            states: true,
            hidden: content => (Number(content?.numberOfMonths) || 1) < 2,
        },

        /* ─── Cell ─── */

        cellSize: {
            label: { en: 'Cell size' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 16, max: 96 },
                    { value: 'rem', label: 'rem', min: 1, max: 6 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '32px',
            bindable: true,
            responsive: true,
            states: true,
            hidden: content => content?.widthMode === 'fill',
            /* wwEditor:start */
            propertyHelp: {
                tooltip:
                    'The exact square size of a day cell. The calendar hugs its grid, so this also sets its width: 7 × this value (8 × with week numbers) plus padding. Below that the grid overflows instead of compressing — lower this value, or switch Width mode to Fill container, for narrow layouts.',
            },
            /* wwEditor:end */
        },

        minCellSize: {
            label: { en: 'Min cell size' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 16, max: 96 },
                    { value: 'rem', label: 'rem', min: 1, max: 6 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '32px',
            bindable: true,
            responsive: true,
            states: true,
            hidden: content => content?.widthMode !== 'fill',
            /* wwEditor:start */
            propertyHelp: {
                tooltip:
                    'The smallest a day cell is allowed to get while the calendar fills its container. Cells grow past it freely; below it the grid overflows instead of compressing further. Also sets the size of the nav buttons.',
            },
            /* wwEditor:end */
        },

        cellRadius: {
            label: { en: 'Cell radius' },
            type: 'Spacing',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 50 },
                    { value: '%', label: '%', min: 0, max: 50 },
                ],
                isCorner: true,
                noRange: true,
                useVar: true,
            },
            defaultValue: '6px',
            bindable: true,
            responsive: true,
            states: true,
        },

        weekGap: {
            label: { en: 'Gap between weeks' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 40 },
                    { value: 'rem', label: 'rem', min: 0, max: 3 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '4px',
            bindable: true,
            responsive: true,
            states: true,
        },

        /* ─── Caption & nav ─── */

        captionFontSize: {
            label: { en: 'Caption size' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 8, max: 48 },
                    { value: 'rem', label: 'rem', min: 0.5, max: 3 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '14px',
            bindable: true,
            responsive: true,
            states: true,
        },

        captionFontWeight: {
            label: { en: 'Caption weight' },
            type: 'TextSelect',
            section: 'style',
            options: { options: FONT_WEIGHT_OPTIONS },
            defaultValue: 500,
            bindable: true,
            responsive: true,
            states: true,
        },

        captionColor: {
            label: { en: 'Caption color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#0A0A0A',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#0A0A0A"`' },
            /* wwEditor:end */
        },

        navIconPrev: {
            label: { en: 'Previous icon' },
            type: 'SystemIcon',
            section: 'style',
            defaultValue: null,
            bindable: true,
            responsive: true,
            states: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'An icon code: `"fas fa-chevron-left" | "wwi wwi-arrow-left"`. Empty uses the built-in chevron.',
            },
            /* wwEditor:end */
        },

        navIconNext: {
            label: { en: 'Next icon' },
            type: 'SystemIcon',
            section: 'style',
            defaultValue: null,
            bindable: true,
            responsive: true,
            states: true,
            /* wwEditor:start */
            bindingValidation: {
                type: 'string',
                tooltip: 'An icon code: `"fas fa-chevron-right" | "wwi wwi-arrow-right"`. Empty uses the built-in chevron.',
            },
            /* wwEditor:end */
        },

        navIconSize: {
            label: { en: 'Icon size' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 8, max: 48 },
                    { value: 'rem', label: 'rem', min: 0.5, max: 3 },
                ],
                noRange: true,
            },
            defaultValue: '16px',
            bindable: true,
            responsive: true,
            states: true,
        },

        navIconColor: {
            label: { en: 'Icon color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#0A0A0A',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#0A0A0A"`' },
            /* wwEditor:end */
        },

        navBgColor: {
            label: { en: 'Button background' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: 'transparent',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"transparent"`' },
            /* wwEditor:end */
        },

        navHoverBgColor: {
            label: { en: 'Button hover background' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#F5F5F5',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#F5F5F5"`' },
            /* wwEditor:end */
        },

        navHoverIconColor: {
            label: { en: 'Button hover icon' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#0A0A0A',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#0A0A0A"`' },
            /* wwEditor:end */
        },

        navBorderRadius: {
            label: { en: 'Button radius' },
            type: 'Spacing',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 0, max: 50 },
                    { value: '%', label: '%', min: 0, max: 50 },
                ],
                isCorner: true,
                noRange: true,
                useVar: true,
            },
            defaultValue: '6px',
            bindable: true,
            responsive: true,
            states: true,
        },

        /* ─── Weekday header ─── */

        weekdayFontSize: {
            label: { en: 'Weekday size' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 8, max: 32 },
                    { value: 'rem', label: 'rem', min: 0.5, max: 2 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '0.8rem',
            bindable: true,
            responsive: true,
            states: true,
        },

        weekdayFontWeight: {
            label: { en: 'Weekday weight' },
            type: 'TextSelect',
            section: 'style',
            options: { options: FONT_WEIGHT_OPTIONS },
            defaultValue: 400,
            bindable: true,
            responsive: true,
            states: true,
        },

        weekdayColor: {
            label: { en: 'Weekday color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#737373',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#737373"`' },
            /* wwEditor:end */
        },

        /* ─── Day ─── */

        dayFontSize: {
            label: { en: 'Day size' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 8, max: 40 },
                    { value: 'rem', label: 'rem', min: 0.5, max: 2.5 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '14px',
            bindable: true,
            responsive: true,
            states: true,
        },

        dayFontWeight: {
            label: { en: 'Day weight' },
            type: 'TextSelect',
            section: 'style',
            options: { options: FONT_WEIGHT_OPTIONS },
            defaultValue: 400,
            bindable: true,
            responsive: true,
            states: true,
        },

        dayColor: {
            label: { en: 'Day color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#0A0A0A',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#0A0A0A"`' },
            /* wwEditor:end */
        },

        dayHoverBgColor: {
            label: { en: 'Day hover background' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#F5F5F5',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#F5F5F5"`' },
            propertyHelp: {
                tooltip:
                    'Background of the day under the cursor. Today, selected and range days keep their own colors on hover.',
            },
            /* wwEditor:end */
        },

        dayHoverColor: {
            label: { en: 'Day hover color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#0A0A0A',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#0A0A0A"`' },
            /* wwEditor:end */
        },

        /* ─── Selected ─── */

        selectedBgColor: {
            label: { en: 'Selected background' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#171717',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#171717"`' },
            /* wwEditor:end */
        },

        selectedColor: {
            label: { en: 'Selected color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#FAFAFA',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#FAFAFA"`' },
            /* wwEditor:end */
        },

        selectedHoverBgColor: {
            label: { en: 'Selected hover background' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#171717',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#171717"`' },
            /* wwEditor:end */
        },

        /* ─── Today ─── */

        todayBgColor: {
            label: { en: 'Today background' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#F5F5F5',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#F5F5F5"`' },
            /* wwEditor:end */
        },

        todayColor: {
            label: { en: 'Today color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#0A0A0A',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#0A0A0A"`' },
            /* wwEditor:end */
        },

        todayFontWeight: {
            label: { en: 'Today weight' },
            type: 'TextSelect',
            section: 'style',
            options: { options: FONT_WEIGHT_OPTIONS },
            defaultValue: 500,
            bindable: true,
            responsive: true,
            states: true,
        },

        /* ─── Range ─── */

        rangeEndpointBgColor: {
            label: { en: 'Range endpoint background' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#171717',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            hidden: content => content?.mode !== 'range',
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#171717"`' },
            /* wwEditor:end */
        },

        rangeEndpointColor: {
            label: { en: 'Range endpoint color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#FAFAFA',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            hidden: content => content?.mode !== 'range',
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#FAFAFA"`' },
            /* wwEditor:end */
        },

        rangeMiddleBgColor: {
            label: { en: 'Range track background' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#F5F5F5',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            hidden: content => content?.mode !== 'range',
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#F5F5F5"`' },
            /* wwEditor:end */
        },

        rangeMiddleColor: {
            label: { en: 'Range track color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#0A0A0A',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            hidden: content => content?.mode !== 'range',
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#0A0A0A"`' },
            /* wwEditor:end */
        },

        /* ─── Outside & disabled ─── */

        outsideDayColor: {
            label: { en: 'Outside day color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#A3A3A3',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#A3A3A3"`' },
            /* wwEditor:end */
        },

        disabledDayColor: {
            label: { en: 'Disabled day color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#A3A3A3',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#A3A3A3"`' },
            /* wwEditor:end */
        },

        disabledDayOpacity: {
            label: { en: 'Disabled day opacity' },
            type: 'Number',
            section: 'style',
            options: { min: 0, max: 1, step: 0.05 },
            defaultValue: 0.5,
            bindable: true,
            responsive: true,
            states: true,
            /* wwEditor:start */
            bindingValidation: { type: 'number', tooltip: 'A number between 0 and 1.' },
            /* wwEditor:end */
        },

        /* ─── Week number ─── */

        weekNumberColor: {
            label: { en: 'Week number color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#737373',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            hidden: content => !content?.showWeekNumber,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#737373"`' },
            /* wwEditor:end */
        },

        weekNumberFontSize: {
            label: { en: 'Week number size' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [
                    { value: 'px', label: 'px', min: 8, max: 32 },
                    { value: 'rem', label: 'rem', min: 0.5, max: 2 },
                ],
                noRange: true,
                useVar: true,
            },
            defaultValue: '0.8rem',
            bindable: true,
            responsive: true,
            states: true,
            hidden: content => !content?.showWeekNumber,
        },

        /* ─── Focus-visible ─── */

        focusRingColor: {
            label: { en: 'Focus ring color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#A1A1A180',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#A1A1A180"`' },
            /* wwEditor:end */
        },

        focusRingWidth: {
            label: { en: 'Focus ring width' },
            type: 'Length',
            section: 'style',
            options: {
                unitChoices: [{ value: 'px', label: 'px', min: 0, max: 10 }],
                noRange: true,
            },
            defaultValue: '3px',
            bindable: true,
            responsive: true,
            states: true,
        },

        /* ─── Invalid ─── */

        invalidBorderColor: {
            label: { en: 'Invalid border color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#DC2626',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#DC2626"`' },
            /* wwEditor:end */
        },

        invalidRingColor: {
            label: { en: 'Invalid ring color' },
            type: 'Color',
            section: 'style',
            options: { nullable: true },
            defaultValue: '#DC262633',
            bindable: true,
            responsive: true,
            states: true,
            classes: true,
            /* wwEditor:start */
            bindingValidation: { cssSupports: 'color', type: 'string', tooltip: 'A color: `"#DC262633"`' },
            /* wwEditor:end */
        },
    },
};
