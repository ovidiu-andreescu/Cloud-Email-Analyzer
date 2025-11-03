import React from "react"

export default function Badge({kind, children}: {kind: "Safe"|"Unsafe"|"Suspicious", children?: React.ReactNode}) {

  const map = {
    Safe: "badge-safe",
    Unsafe: "badge-unsafe",
    Suspicious: "badge-suspicious"
  } as const

  const tooltipMap = {
    Safe: "This email is safe. ",
    Unsafe: "This email has been classified as unsafe and potentially malicious.",
    Suspicious: "This email has suspicious content. Review needed."
  }

  return (
    <span
      className={"badge " + map[kind] + " cursor-help"}
      title={tooltipMap[kind]}
    >
      {children ?? kind}
    </span>
  )
}