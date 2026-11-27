"use client"

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

import { fieldControlClass } from "./input"

type Choice = {
  readonly value: string
  readonly label: string
  readonly group: string | null
  readonly disabled: boolean
}

type OptionProps = {
  value?: string | number
  disabled?: boolean
  children?: ReactNode
}
type GroupProps = { label?: string; children?: ReactNode }

const textOf = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean")
    return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (isValidElement<{ children?: ReactNode }>(node))
    return textOf(node.props.children)
  return ""
}

/** The <option>s and <optgroup>s passed as children, in order. */
const choicesOf = (children: ReactNode, group: string | null = null) =>
  Children.toArray(children).flatMap((child): Choice[] => {
    if (!isValidElement(child)) return []
    if (child.type === "optgroup") {
      const props = (child as ReactElement<GroupProps>).props
      return choicesOf(props.children, props.label ?? null)
    }
    if (child.type === "option") {
      const props = (child as ReactElement<OptionProps>).props
      const label = textOf(props.children)
      return [
        {
          value: props.value === undefined ? label : String(props.value),
          label,
          group,
          disabled: Boolean(props.disabled),
        },
      ]
    }
    // Fragments and wrappers: look inside.
    return choicesOf(
      (child as ReactElement<{ children?: ReactNode }>).props.children,
      group
    )
  })

/**
 * Options whose name contains the search. Only when none does are category
 * names searched too, so "cloudflare" finds Cloudflare services rather than
 * everything filed under "Cloudflare, domains & security".
 */
const filterChoices = (choices: readonly Choice[], query: string) => {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...choices]
  const byName = choices.filter((choice) =>
    choice.label.toLowerCase().includes(needle)
  )
  return byName.length > 0
    ? byName
    : choices.filter((choice) => choice.group?.toLowerCase().includes(needle))
}

/** Room the list needs below the field before it opens upwards instead. */
const LIST_ROOM = 300

/** What onChange receives: the parts of a change event callers read. */
type SelectChange = Pick<ChangeEvent<HTMLSelectElement>, "target">

type SelectProps = {
  id?: string
  name?: string
  value?: string | number
  defaultValue?: string | number
  onChange?: (event: SelectChange) => void
  disabled?: boolean
  required?: boolean
  className?: string
  children: ReactNode
  "aria-label"?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

/**
 * The one dropdown. Closed, it shows the chosen option; open, the field
 * becomes a search box over the options (grouped, if the children use
 * <optgroup>). A hidden native <select> carries the value, so forms submit,
 * validate and reset as they would with a plain select.
 */
export function Select({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled = false,
  required = false,
  className,
  children,
  ...aria
}: SelectProps) {
  const choices = choicesOf(children)
  const initial = String(defaultValue ?? choices[0]?.value ?? "")
  const [own, setOwn] = useState(initial)
  const selected = value === undefined ? own : String(value)
  const current = choices.find((choice) => choice.value === selected)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [above, setAbove] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const nativeRef = useRef<HTMLSelectElement>(null)
  const generatedId = useId()
  const inputId = id ?? `${generatedId}-select`
  const listId = `${inputId}-options`
  const optionId = (index: number) => `${inputId}-option-${index}`

  const visible = filterChoices(choices, query)
  const enabled = (index: number) => !visible[index]?.disabled

  // Keep the highlighted option in view while moving with the keyboard.
  useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(optionId(active))}`)
      ?.scrollIntoView({ block: "nearest" })
  })

  // A form reset puts the field back to where it started.
  useEffect(() => {
    const form = nativeRef.current?.form
    if (!form) return
    const reset = () => setOwn(initial)
    form.addEventListener("reset", reset)
    return () => form.removeEventListener("reset", reset)
  }, [initial])

  const openList = (startQuery = "") => {
    if (disabled) return
    const list = filterChoices(choices, startQuery)
    const box = rootRef.current?.getBoundingClientRect()
    if (box) {
      const below = window.innerHeight - box.bottom
      setAbove(below < LIST_ROOM && box.top > below)
    }
    const at = startQuery
      ? list.findIndex((choice) => !choice.disabled)
      : list.findIndex((choice) => choice.value === selected)
    setQuery(startQuery)
    setActive(Math.max(0, at))
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setQuery("")
  }

  const choose = (choice: Choice | undefined) => {
    if (!choice || choice.disabled) return
    close()
    if (choice.value === selected) return
    if (value === undefined) setOwn(choice.value)
    onChange?.({
      target: { value: choice.value, name: name ?? "" },
    } as SelectChange)
  }

  const move = (step: 1 | -1) => {
    if (visible.length === 0) return
    let next = active
    for (let tries = 0; tries < visible.length; tries += 1) {
      next = (next + step + visible.length) % visible.length
      if (enabled(next)) break
    }
    setActive(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault()
        openList()
      } else if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        // Typing on a closed dropdown starts a search.
        event.preventDefault()
        openList(event.key)
      }
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      move(1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      move(-1)
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      setActive(event.key === "Home" ? 0 : Math.max(0, visible.length - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      choose(visible[active])
    } else if (event.key === "Escape") {
      event.preventDefault()
      close()
    } else if (event.key === "Tab") {
      close()
    }
  }

  let lastGroup: string | null = null

  return (
    <div ref={rootRef} className="relative">
      <input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-activedescendant={
          open && visible[active] ? optionId(active) : undefined
        }
        aria-label={aria["aria-label"]}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        readOnly={!open}
        value={open ? query : (current?.label ?? "")}
        placeholder={open ? current?.label || "Search…" : undefined}
        onClick={() => (open ? undefined : openList())}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(
            Math.max(
              0,
              filterChoices(choices, event.target.value).findIndex(
                (choice) => !choice.disabled
              )
            )
          )
        }}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget)) close()
        }}
        className={cn(
          fieldControlClass,
          "h-11 truncate pr-10",
          open ? "cursor-text" : "cursor-pointer",
          className
        )}
      />
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground transition-transform motion-reduce:transition-none",
          open && "rotate-180"
        )}
        aria-hidden="true"
      />
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={aria["aria-label"]}
          aria-labelledby={aria["aria-label"] ? undefined : inputId}
          className={cn(
            "absolute z-50 max-h-72 w-full min-w-48 overflow-y-auto rounded-field border bg-card p-1",
            above ? "bottom-full mb-1" : "mt-1"
          )}
        >
          {visible.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No matches
            </li>
          ) : (
            visible.map((choice, index) => {
              const header =
                choice.group && choice.group !== lastGroup ? choice.group : null
              lastGroup = choice.group
              return (
                <li
                  key={`${choice.group ?? ""}:${choice.value}`}
                  role="presentation"
                >
                  {header ? (
                    <div
                      aria-hidden="true"
                      className="px-3 pt-2 pb-1 text-meta"
                    >
                      {header}
                    </div>
                  ) : null}
                  <div
                    id={optionId(index)}
                    role="option"
                    data-value={choice.value}
                    aria-selected={choice.value === selected}
                    aria-disabled={choice.disabled || undefined}
                    // Keep focus in the search box while clicking.
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() =>
                      enabled(index) ? setActive(index) : null
                    }
                    onClick={() => choose(choice)}
                    className={cn(
                      "flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 py-2 text-sm",
                      index === active && "bg-foreground/8",
                      choice.disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <span className="flex-1">{choice.label}</span>
                    {choice.value === selected ? (
                      <Check className="size-4 shrink-0" aria-hidden="true" />
                    ) : null}
                  </div>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
      <select
        ref={nativeRef}
        name={name}
        value={selected}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {children}
      </select>
    </div>
  )
}
