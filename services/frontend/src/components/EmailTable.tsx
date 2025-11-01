import React from "react"
import Badge from "./Badge"
import type { Email } from "../lib/api"

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
              <tr key={e.id} className={"border-t border-slate-100 " + (idx%2 ? "bg-white" : "bg-white")}>
                <td className="px-6 py-4">{e.email_id}</td>
                <td className="px-6 py-4">{e.sender}</td>
                <td className="px-6 py-4">{e.recipient}</td>
                <td className="px-6 py-4">{e.subject}</td>
                <td className="px-6 py-4">{e.category}</td>
                <td className="px-6 py-4">
                  <Badge kind={e.verdict}>{e.verdict}</Badge>
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
