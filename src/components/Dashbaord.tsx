"use client";
import { useEffect, useState } from "react";

type Detection = { label: string; confidence: number };
type Alert = { weapon_detected: boolean; objects: Detection[]; time: string };

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws");

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.ping) return; // ← ignore keep-alive pings
      console.log("WS received:", data);
      if (data.weapon_detected) {
        setAlerts((prev) => [
          { ...data, time: new Date().toLocaleTimeString() },
          ...prev,
        ]);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="p-10">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">🛡️ Security Dashboard</h1>
        <span
          className={`text-sm px-2 py-1 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {connected ? "● Connected" : "● Disconnected"}
        </span>
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-500">No threats detected yet.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="bg-red-50 border border-red-400 px-4 py-3 rounded-lg"
            >
              <p className="font-semibold text-red-700">
                ⚠️ Object detected — {alert.time}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {alert.objects.map((obj, j) => (
                  <span
                    key={j}
                    className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded"
                  >
                    {obj.label} {obj.confidence}%
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
