/** Circle with a check mark that draws itself (stroke-dashoffset, see .success-mark in CSS). */
export function SuccessMark() {
  return (
    <svg className="success-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle className="success-circle" cx="32" cy="32" r="29" pathLength="1" />
      <path className="success-check" d="M20 33.5 28.5 42 45 24" pathLength="1" />
    </svg>
  )
}
