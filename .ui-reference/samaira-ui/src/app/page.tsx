"use client";
import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import RightRail from "../components/layout/RightRail";
import ChatPanel from "../components/chat/ChatPanel";

export default function SamairaApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "var(--bg-page)",
      overflow: "hidden",
    }}>
      {/* Desktop sidebar — hidden below 1024px */}
      <div style={{ display: "var(--sidebar-display, flex)" }} className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(11,61,46,0.4)",
              backdropFilter: "blur(2px)",
            }}
          />
          <div style={{ position: "relative", width: 240, zIndex: 51, height: "100%" }}>
            <Sidebar onMobileClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: "flex",
        gap: 12,
        padding: "12px",
        overflow: "hidden",
        minWidth: 0,
      }}>
        <ChatPanel onMenuOpen={() => setSidebarOpen(true)} />

        {/* Right rail — hidden below 1024px via CSS */}
        <div className="rail-desktop" style={{ display: "var(--rail-display, flex)" }}>
          <RightRail />
        </div>
      </div>

      {/* Responsive visibility CSS */}
      <style>{`
        .sidebar-desktop { display: flex !important; }
        .rail-desktop     { display: flex !important; }
        @media (max-width: 1023px) {
          .sidebar-desktop { display: none !important; }
        }
        @media (max-width: 860px) {
          .rail-desktop { display: none !important; }
        }
        .sr-only {
          position: absolute; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden;
          clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }
      `}</style>
    </div>
  );
}
