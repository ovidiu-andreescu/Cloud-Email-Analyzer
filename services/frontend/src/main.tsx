import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./App"
import "./styles.css"

import ApiDocs from "./pages/ApiDocs"
import Login from "./pages/Login"
import Inbox from "./pages/Inbox"
import MessageDetail from "./pages/MessageDetail"
import Admin from "./pages/Admin"
import AdminMessagesPage from "./pages/AdminMessagesPage"
import AuditLogPage from "./pages/AuditLogPage"


const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Inbox />,
      },
      {
        path: "/messages/:messageId",
        element: <MessageDetail />,
      },
      {
        path: "/admin",
        element: <Admin />,
      },
      {
        path: "/admin/messages",
        element: <AdminMessagesPage />,
      },
      {
        path: "/admin/audit-log",
        element: <AuditLogPage />,
      },
      {
        path: "/api-docs",
        element: <ApiDocs />,
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
