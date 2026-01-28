"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients, projects, campaigns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{session?.user?.name}</p>
              <p className="text-gray-500">{(session?.user as { role?: string })?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
