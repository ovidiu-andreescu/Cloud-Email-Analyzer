import React from "react"
import Badge from "./Badge"
import type { Email } from "../lib/api"

type ValidVerdict = "Safe" | "Unsafe" | "Suspicious"
function isValidVerdict(verdict: string | null | undefined): verdict is ValidVerdict {
  return verdict === "Safe" || verdict === "Unsafe" || verdict === "Suspicious"
}

export default function EmailTable({items}:{items: Email[]}){
  return (
    <div className="overflow-hidden card">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-slate-400 text-sm">
              {["Email ID","Sender","Recipient","Subject","Category","Verdict"].map(h => (
                <th key={h} className="px-6 py-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((e, idx) => (
              <tr key={e.messageId} className={"border-t border-slate-100 " + (idx%2 ? "bg-white" : "bg-white")}>
                <td className="px-6 py-4">{e.messageId}</td>
                <td className="px-6 py-4">{e.sender}</td>
                <td className="px-6 py-4">{e.recipient}</td>
                <td className="px-6 py-4">{e.subject}</td>
                <td className="px-6 py-4">{e.category}</td>
                <td className="px-6 py-4">
                  {isValidVerdict(e.verdict) ? (
                    <Badge kind={e.verdict}>{e.verdict}</Badge>
                  ) : (
                    e.verdict
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 text-sm text-slate-500 border-t border-slate-100">
        Showing data from demo API
      </div>
    </div>
  )
}
