# jpui-calendar

A [shadcn](https://ui.shadcn.com/docs/components/base/calendar)-styled inline calendar,
packaged as a WeWeb custom element.

The reference implementation is React + `react-day-picker` + Tailwind. Neither travels: WeWeb
elements are Vue 3, and Tailwind utility classes aren't editable from the sidepanel. So this port
keeps shadcn's DOM structure, `data-*` state contract and visual language, and re-expresses every
Tailwind token — `bg-primary`, `bg-muted`, `--cell-size`, `--cell-radius` — as a `ww-config`
property feeding a CSS custom property. A fresh instance already looks like the original; every
part of it can be restyled without writing CSS.

## What it does

- **Single-date and date-range selection.** Range mode previews the middle band under the cursor
  and draws a continuous track across week boundaries.
- **Timezone-safe values.** The selection is stored as a date-only string, `"2026-08-14"`, never a
  `Date` or an ISO timestamp — those drift a day when read back in another timezone.
- **Constraints.** Min/max dates, individual blocked dates (typed in or mapped from a bound
  collection), blocked weekdays, and minimum/maximum range length.
- **Keyboard operation.** One tab stop; arrows move within and across months, Home/End jump to the
  week edges, PageUp/PageDown change month (Shift for year), Enter selects, Escape cancels a
  pending range.
- **Multi-month, week numbers, dropdown captions.** 1–12 consecutive months laid out horizontally
  or vertically, optional ISO or locale week numbering, and native month/year selects for fast
  navigation.
- **Localization with no bundle cost.** Month and weekday names come from the browser's `Intl`,
  driven by a BCP-47 tag, so any locale works without shipping a locale file.
- **Form integration.** Field name, required and custom validation, reset to the initial value.

## Value shape

| Mode | Stored value |
|---|---|
| `single` | `"2026-08-14"` or `null` |
| `range` | `{ start: "2026-08-14", end: "2026-08-20" }` — `end` is `null` while the range is open |

Reading is tolerant: a `Date`, a timestamp, an ISO datetime, `{ from, to }` and `[start, end]` are
all understood on the way in. Writing is not — the value you bind against is always the shape above.

## Sizing

The calendar is `width: fit-content` — it hugs its grid rather than stretching, so a day
cell is exactly **Cell size** at any container width, and cells hold a 1:1 aspect ratio.
A width set in WeWeb's style panel still overrides this.

That gives it a hard minimum width of **7 × Cell size** (8 × with week numbers):
`table-layout: fixed` will not shrink columns below their declared width, so below that
floor the grid overflows its container instead of compressing. Lower Cell size for narrow
layouts.

Measured in Chromium at the defaults: 224 px wide, stable from a 240 px container up to
800 px; two months side by side come to 464 px; at Cell size 48 it is 336 px. Any padding
or border you add from the element style panel sits outside those numbers.

## Settings

33 properties, but only **9 rows** are visible on a fresh instance. Settings have no
collapsible groups in WeWeb — the only tools are ordering, shared rows, and `hidden` — so
the panel is built on progressive disclosure: a property appears the moment it becomes
relevant, next to the control that made it relevant.

```
1  Selection mode
2  Initial value
3  Default month  |  Months shown
4  Min date  |  Max date  |  Disabled dates  |  Disabled weekdays
5  Caption  |  Hide navigation
6  Show outside days  |  Fixed weeks  |  Show week numbers
7  Locale  |  Week starts on  |  Formatted value
8  Disabled  |  Read-only  |  Required  |  Invalid
9  Aria label
```

The reading order is: the value and the view it opens on → which days are pickable → how the
grid looks → language and formatting → state, accessibility, form. It mirrors the order
`jpui-radiogroup` uses for its own settings.

7 more rows stay hidden until they apply:

| Appears when | Row |
|---|---|
| Months shown ≥ 2 | Months layout, as a third column on row 3 |
| Disabled dates is bound | Disabled date field (the mapping formula) |
| Selection mode is `range` | Min / Max range length |
| Caption uses a year dropdown | First year / Last year |
| Show week numbers is on | ISO week numbers |
| Formatted value is `custom` | Custom pattern, full width |
| Placed inside a form | Form infobox, Field name / Custom validation / Validation |

## Styling

43 style properties, grouped into collapsible sections in the sidepanel:

**Calendar** · **Cell** · **Caption & nav** · **Weekday header** · **Day** · **Selected** ·
**Today** · **Range** · **Outside & disabled** · **Week number** · **Focus-visible** · **Invalid**

The **Calendar** group is deliberately thin — just Font family and Month gap. Background,
padding, border and border-radius belong to WeWeb's own element style panel on the root;
declaring them from the component too put two competing sources on the same properties.

Every one of them is bindable, responsive and state-aware. They are declared through the
top-level `css()` hook in `ww-config.js`, which hands them to WeWeb's style compiler as
`--jpc-*` custom properties; the scoped SCSS reads each one back as `var(--jpc-x, <default>)`.

That indirection is the point: the compiler generates one CSS rule per breakpoint, per state
and per design-system class. Building the same variables in an inline `:style` would ship only
the base value and silently drop every variant — hover, focus, disabled, mobile, class overrides.

## States

Four states, all **selector-based** — WeWeb generates the CSS, the component emits nothing.
Each one is anchored on the component root, which is the only shape WeWeb supports: a state
says *"the whole calendar is in state X"*. Per-item styling (the day under the cursor) is
therefore a normal style property, not a state — see `dayHoverBgColor` / `dayHoverColor`.

| State | Matched by |
|---|---|
| `focus-visible` | `&:focus-visible, &:has(:focus-visible)` — focus lands on a day button, and the browser decides keyboard vs mouse |
| `disabled` | `&[aria-disabled="true"]`, plus `&[data-ww-disabled="true"]` |
| `readonly` | `&[aria-readonly="true"]` |
| `invalid` | `&[aria-invalid="true"]` |

The applicative three are driven by real ARIA attributes on the root, so they style the
component *and* announce it to assistive tech. Inactive binds to `null`, never `"false"`.

On the WeWeb canvas the day buttons drop their real `disabled` attribute — a disabled form
control suppresses the click the editor needs to select the element — and expose
`data-ww-disabled` instead. In preview and in production the real attribute is back.

## Local context

```js
context.local.data?.['calendar']?.['value']              // the raw selection
context.local.data?.['calendar']?.['formatted']          // rendered per the Formatted value setting
context.local.data?.['calendar']?.['range']?.['dayCount']
context.local.data?.['calendar']?.['displayedMonth']
context.local.data?.['calendar']?.['utils']?.['isInvalid']
```

## Events and actions

Events: `change`, `initValueChange`, `dayClick`, `rangeComplete`, `monthChange`, `focus`, `blur`.

Actions: `Set value`, `Reset value`, `Clear value`, `Go to month`, `Next month`, `Previous month`,
`Go to today`, `Focus`.

## Not included

There is **no built-in popover**. This is the calendar surface only, matching shadcn's `<Calendar />`
rather than its composed `<DatePicker />`. To build a date-picker dropdown, place this element
inside a WeWeb dropdown or dialog and close it from the `change` event.

## Development

```bash
npm i
npm run serve --port=8080                          # then add it via the editor's developer popup
npm run build -- --name=jpui-calendar --type=wwobject
```

Note the `--` before the build args. Without it npm swallows `--name` and the CLI stops early —
while still exiting `0`, so read the output rather than trusting the exit code.

## Dependencies

`date-fns@4.1.0` for date arithmetic — the same version WeWeb's own date-time picker ships. Locale
names deliberately go through `Intl` instead, so no `date-fns` locale files are bundled.

## Status

**v0.1.0 — built and unit-tested, not yet exercised in the WeWeb editor.**

`npm run build` is clean and 161 headless checks pass across four suites: SSR render, selection
and keyboard logic, a DOM pass under happy-dom, and a pass over the *editor* bundle (the one
with the `wwEditor` blocks left in, where the canvas-selectability and state-preview behaviour
lives). The layout numbers in **Sizing** were measured in Chromium.

None of that is the same as running inside WeWeb. Two things in particular are unverified and
worth checking first on a placed instance:

- whether `bindable: true` style properties resolve through the style compiler — every style
  property here is bindable, and WeWeb's published docs do not cover the `css()` hook at all;
- how the four-column rows render, especially row 4, which mixes two `Text` inputs with two
  expandable `Array` controls.

Bump the version on every re-sync: the editor gates the installed build on it, so a component
republished under the same version may not pick up changes.
