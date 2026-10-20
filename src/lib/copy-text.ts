export async function copyText(value: string) {
  const text = value ?? ""
  if (copyWithCommand(text)) return
  window.focus()
  await navigator.clipboard.writeText(text)
}

export function selectElementText(element: HTMLElement) {
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
}

function copyWithCommand(text: string) {
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.inset = "0"
  area.style.opacity = "0"
  const root = document.activeElement?.closest("[role='dialog']") ?? document.body
  root.appendChild(area)
  area.focus({ preventScroll: true })
  area.select()
  area.setSelectionRange(0, text.length)
  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    area.remove()
  }
}
