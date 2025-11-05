"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Analyze", href: "/analyze" },
  { name: "Library", href: "/library" },
  { name: "Monetization", href: "/monetization" },
  { name: "Reporting", href: "/reporting" },
  { name: "GAM Setup", href: "/gam-setup" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-indigo-950 text-white">
      <div className="flex h-16 items-center border-b border-indigo-900 px-6">
        <h1 className="text-xl font-bold">Modulr Studio</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-800 text-white"
                  : "text-indigo-200 hover:bg-indigo-900 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-indigo-900 p-4">
        <p className="text-xs text-indigo-400">
          SSP Platform v0.1.0
        </p>
      </div>
    </div>
  );
}
