import React from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./components/Sidebar"

export default function App() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}