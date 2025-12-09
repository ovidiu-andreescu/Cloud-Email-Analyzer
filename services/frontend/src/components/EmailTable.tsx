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
              {["Email ID","Sender","Recipient","Subject","Category","ML Verdict", "Virus Scan"].map(h => (
                <th key={h} className="px-6 py-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((e, idx) => (
              <tr key={e.messageId} className={"border-t border-slate-100 " + (idx%2 ? "bg-white" : "bg-white")}>
                <td className="px-6 py-4 max-w-[150px] truncate" title={e.messageId}>{e.messageId}</td>
                <td className="px-6 py-4 max-w-[200px] truncate" title={e.sender}>{e.sender}</td>
                <td className="px-6 py-4 max-w-[200px] truncate" title={e.recipient}>{e.recipient}</td>
                <td className="px-6 py-4 max-w-[250px] truncate" title={e.subject}>{e.subject}</td>
                <td className="px-6 py-4">{e.category}</td>

                {/* COLUMN 1: ML Verdict */}
                <td className="px-6 py-4">
                  {isValidVerdict(e.verdict) ? (
                    <Badge kind={e.verdict}>{e.verdict}</Badge>
                  ) : (
                    <span className="text-slate-500 text-sm">{e.verdict || "Pending"}</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {isValidVerdict(e.virus_verdict) ? (
                    <Badge kind={e.virus_verdict}>{e.virus_verdict}</Badge>
                  ) : (
                    <span className="text-slate-400 text-sm italic">{e.virus_verdict || "Not Scanned"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 text-sm text-slate-500 border-t border-slate-100">
        Showing latest emails
      </div>
    </div>
  )
}