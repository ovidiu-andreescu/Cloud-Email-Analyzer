import React from "react"

export default function Pagination({page, pageSize, total, onPage}:{page:number, pageSize:number, total:number, onPage:(p:number)=>void}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const items = []
  const start = Math.max(1, page - 2)
  const end = Math.min(pages, page + 2)
  for (let i = start; i <= end; i++) items.push(i)
  return (
    <div className="flex items-center gap-2">
      <button disabled={page<=1} onClick={()=>onPage(page-1)} className="px-3 py-1 rounded-lg disabled:opacity-50 bg-white">‹</button>
      {start>1 && <span className="px-2">…</span>}
      {items.map(i => (
        <button key={i} onClick={()=>onPage(i)} className={"px-3 py-1 rounded-lg " + (i===page ? "bg-primary text-white" : "bg-white")}>{i}</button>
      ))}
      {end<pages && <span className="px-2">…</span>}
      <button disabled={page>=pages} onClick={()=>onPage(page+1)} className="px-3 py-1 rounded-lg disabled:opacity-50 bg-white">›</button>
    </div>
  )
}
