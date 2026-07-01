/**
 * Create new HTML element
 */
export function createElement<T extends HTMLElement>(opts: {
    tagName: string
    selector?: string
    html?: null | string
    parent?: null | HTMLElement
    css?: HTMLElement['style']
}): T {
    const { tagName, selector, html, parent, css } = opts
    let el = document.createElement(tagName) as T
    selector && (el.className = selector)
    css && Object.assign(el.style, css)

    parent && parent.appendChild(el)
    html != null && (el.innerHTML = html)
    return el
}

/**
 * Remove dom element
 */
export function removeElement(el: HTMLElement | any): void {
    if (!el) {
        return
    }

    el.remove ? el.remove() : el.parentNode ? el.parentNode.removeChild(el) : null
}

/**
 * Get node element parents
 */
export function parents<T extends HTMLElement>(el: T): T[] {
    const els: T[] = []
    let tmp: T = el
    while (tmp && tmp.tagName !== 'BODY') {
        els.unshift(tmp)
        tmp = tmp.parentNode as T
    }
    return els
}

/**
 * Clear selected area
 */
export function clearSelected(): void {
    let w = window
    let d = document
    if (w?.getSelection) {
        if (w.getSelection()?.empty) {
            w.getSelection()!.empty()
        } else if (w.getSelection()?.removeAllRanges) {
            w.getSelection()!.removeAllRanges()
        }
    } else if ('selection' in d) {
        (d.selection as any).empty()
    }
}

/**
 * Detect element is td|th
 */
export function isTableCell(el: HTMLElement): boolean {
    return ['TD', 'TH'].includes(el.tagName)
}

/**
 * aaaAaa to aaa-a-aa
 */
export function camelCaseToKebabCase(string: string): string {
    return string.replace(/[A-Z]/g, m => `-${m[0].toLowerCase()}`)
}

/**
 * aaaaa to Aaaaa
 */
export function firstCharToUp(str: string): string {
    return `${str[0].toUpperCase()}${str.slice(1)}`
}

/**
 * Extract number from string
 */
export function getNumberFromString(str: string | number): number {
    if (!str) {
        return 0
    }
    if (typeof str === 'number') {
        return str
    }
    const m = str.toString()
        .replace(/[^0-9.,]/g, '')
        .replace(/,/g, '.')
        .match(/^\d*\.?\d*([^.])/)
    if (!m) {
        return 0
    }
    return +m[0]
}

/**
 * Merge values
 */
export function mergeValues<T extends (string | number | null)>(v1: T, v2: T): T {
    let type1 = typeof v1
    let type2 = typeof v2
    if (type1 === type2 && v1 === v2 && !v1) {
        return v1
    }
    // null, empty and undefined
    const [_v1, _v2]: (string | number)[] = [v1, v2].map(i => i ?? '') as (string | number)[]

    return type1 === 'number' && type1 === type2
        ? Number(_v1) + Number(_v2) as T
        : prepareValue(`${v1 as string} ${v2 as string}`) as T
}

/**
 * Prepare save value
 */
export function prepareValue<T extends (string | number | null)>(val: T): T {
    if (!val) {
        return val
    }
    return typeof val === 'number'
        ? val
        : (val as any)
                .replace(/&nbsp;/g, ' ')
                .replace(/\r?\n/g, '')
                .trim()
}

/**
 * Random
 */
export function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Random uniq key
 */
export function randKey(): string {
    return Array.from({ length: 12 }).map(() => rand(0, 9)).join('')
}

/**
 * Is key code ignore
 */
export function _keysIgnore(key: string): boolean {
    const keys = new Set<string>([
        'Alt',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'CapsLock',
        'Control',
        'End',
        'Enter',
        'Escape',
        'F1',
        'F10',
        'F11',
        'F12',
        'F2',
        'F3',
        'F4',
        'F5',
        'F6',
        'F7',
        'F8',
        'F9',
        'Home',
        'Insert',
        'Meta',
        'NumLock',
        'PageDown',
        'PageUp',
        'Pause',
        'ScrollLock',
        'Shift',
        'Tab',
    ],
    )
    return keys.has(key)
}

/**
 * Clone array (max level 2)
 */
export function cloneArray<T>(array: T[][]): T[][] {
    return array.map(a => [...a])
}

/**
 * Split key by ::
 */
export function _splitKey(key: string): [number, number] {
    return key.split('::').map(Number) as [number, number]
}
