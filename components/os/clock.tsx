"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  if (!now) return <span className="tabular-nums">--:--</span>;

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const day = now.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <span className="tabular-nums">
      {day} {time}
    </span>
  );
}
