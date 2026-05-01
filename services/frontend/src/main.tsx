import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./App"
import "./styles.css"


import Dashboard from "./pages/Dashboard"
import ApiDocs from "./pages/ApiDocs"
import Login from "./pages/Login"
import Inbox from "./pages/Inbox"
import MessageDetail from "./pages/MessageDetail"
import Admin from "./pages/Admin"


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
        path: "/api-docs",
        element: <ApiDocs />,
      },
      // Other routes can be added later here
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
