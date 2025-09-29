// src/components/Layout.jsx
import React from "react";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children }) {
  const sidebarOpen = useSelector((state) => state.app.sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* шапка уже сама делает pl-64 / pl-16 */}
      <Header />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        {/* Синхронизируем сдвиг контента с хедером:
            когда открыт — 16rem, когда закрыт — 4rem (узкая рейка иконок) */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-16"
          }`}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
