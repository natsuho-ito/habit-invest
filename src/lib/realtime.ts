import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/** Broadcast で流すイベント（habitId を含める） */
// export type HabitLogEvent = {
//   kind: "insert";
//   date: string;
//   amount: number;
//   habitId: string;
//   habitTitle: string | null;
// };

export type HabitLogEvent = {
  kind: "insert" | "update" | "delete";
  date: string;
  amount: number;
  habitId: string;
  habitTitle?: string;
};

let channel: RealtimeChannel | null = null;

/** アプリ共通のチャンネル（self: true で自分にも届く） */
export function getHabitLogsChannel(): RealtimeChannel {
  if (channel) return channel;
  const client = supabaseBrowser();
  channel = client.channel("habit_logs:broadcast", {
    config: { broadcast: { self: true } },
  });
  return channel;
}

/** 送信（ActiveHabits から使用） */
export function sendHabitLogBroadcast(payload: HabitLogEvent): void {
  getHabitLogsChannel().send({ type: "broadcast", event: "habit_log", payload });
}

/** 受信の型安全ヘルパー（SevenDayChart などで使用すると as 不要） */
export function subscribeHabitLog(
  cb: (e: HabitLogEvent) => void
): RealtimeChannel {
  return getHabitLogsChannel()
    .on("broadcast", { event: "habit_log" }, (msg) => {
      cb(msg.payload as HabitLogEvent);
    })
    .subscribe();
}
