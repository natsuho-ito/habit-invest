// JSTのYYYY-MM-DDを返す
export function toYmdJST(d: Date) {
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = parts.find(p => p.type === "year")!.value;
    const m = parts.find(p => p.type === "month")!.value;
    const day = parts.find(p => p.type === "day")!.value;
    return `${y}-${m}-${day}`;
  }
  