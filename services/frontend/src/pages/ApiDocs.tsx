import React from "react"

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-slate-800 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto">
      <code>
        {children}
      </code>
    </pre>
  )
}

function Method({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-bold text-sm bg-blue-600 text-white px-3 py-1 rounded-md mr-3">
      {children}
    </span>
  )
}

export default function ApiDocs() {
  const endpoints = [
    {
      method: "GET",
      path: "/api/metrics",
      description: "Fetches aggregated metrics for the dashboard's stat cards.",
      response: `{
  "total_users": number,
  "total_emails": number,
  "active_now": number,
  "active_this_month_delta_pct": number,
  "emails_this_week_delta_pct": number
}`
    },
    {
      method: "GET",
      path: "/api/emails",
      description: "Fetches a paginated list of analyzed emails. Supports filtering, sorting, and searching.",
      queryParams: [
        { param: "q", type: "string", description: "Search query for sender, recipient, or subject." },
        { param: "category", type: "'Spam' | 'Ham' | 'Promotional'", description: "Filter by email category." },
        { param: "verdict", type: "'Safe' | 'Unsafe' | 'Suspicious'", description: "Filter by analysis verdict." },
        { param: "sort", type: "'newest' | 'oldest'", description: "Sort order (default: 'newest')." },
        { param: "page", type: "number", description: "Page number for pagination (default: 1)." },
        { param: "page_size", type: "number", description: "Number of items per page (default: 8)." },
      ],
      response: `{
  "items": [
    {
      "id": number,
      "email_id": number,
      "sender": string,
      "recipient": string,
      "subject": string,
      "category": "Spam" | "Ham" | "Promotional",
      "verdict": "Safe" | "Unsafe" | "Suspicious"
    }
  ],
  "total": number,
  "page": number,
  "page_size": number
}`
    }
  ]

  return (
    <div className="text-slate-800">
      <header>
        <h1 className="text-3xl font-bold">API Endpoints</h1>
        <p className="mt-2 text-slate-600">
          This page documents the API endpoints used by the frontend to communicate with the web server.
        </p>
      </header>

      <div className="mt-10 space-y-12">
        {endpoints.map(endpoint => (
          <section key={endpoint.path} className="card p-6">
            <div className="flex items-center">
              <Method>{endpoint.method}</Method>
              <span className="font-mono text-xl font-medium">{endpoint.path}</span>
            </div>
            <p className="mt-3 text-slate-600">{endpoint.description}</p>

            {endpoint.queryParams && (
              <>
                <h3 className="mt-6 text-lg font-semibold">Query Parameters</h3>
                <div className="mt-3 border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Parameter</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {endpoint.queryParams.map(param => (
                        <tr key={param.param} className="border-t">
                          <td className="px-4 py-3 font-mono text-sm">{param.param}</td>
                          <td className="px-4 py-3 font-mono text-sm text-purple-700">{param.type}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h3 className="mt-6 text-lg font-semibold">Example Response</h3>
            <div className="mt-3">
              <CodeBlock>{endpoint.response}</CodeBlock>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}