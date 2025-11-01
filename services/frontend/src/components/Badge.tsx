import React from "react"

export default function Badge({kind, children}: {kind: "Safe"|"Unsafe"|"Suspicious", children?: React.ReactNode}) {
  const map = {
    Safe: "badge-safe",
    Unsafe: "badge-unsafe",
    Suspicious: "badge-suspicious"
  } as const
  return <span className={"badge " + map[kind]}>{children ?? kind}</span>
}
