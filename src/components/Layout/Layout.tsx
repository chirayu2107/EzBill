import type React from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-900">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
