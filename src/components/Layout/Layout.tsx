import type React from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#111113] transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
