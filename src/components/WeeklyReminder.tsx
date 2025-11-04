"use client";

import { useEffect, useState } from "react";

export default function WeeklyReminder() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday
    const lastShown = localStorage.getItem("weeklyReminderShown");

    // 日曜日かつ、まだ今日表示していなければポップアップを出す
    if (day === 0) {
      const todayKey = today.toISOString().slice(0, 10); // "YYYY-MM-DD"
      if (lastShown !== todayKey) {
        setShow(true);
      }
    }
  }, []);

  const handleClose = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("weeklyReminderShown", today);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
        <h2 className="text-lg font-semibold mb-3">🌱 リマインダー</h2>
        <p className="text-sm text-gray-700 mb-4">
          今日は日曜日、目標と習慣を見直そう！
        </p>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          OK
        </button>
      </div>
    </div>
  );
}
