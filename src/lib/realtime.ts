import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export type HabitLogEvent =
  | { kind: "insert"; date: string; amount: number; habitTitle: string | null }
  | { kind: "update"; date: string; amount: number; habitTitle: string | null }
  | { kind: "delete"; date: string; habitTitle: string | null }; // amountは不要でもOK

let channel: RealtimeChannel | null = null;

export function getHabitLogsChannel(): RealtimeChannel {
  if (channel) return channel;
  const client = supabaseBrowser();
  channel = client.channel("habit_logs:broadcast", {
    config: { broadcast: { self: true } }, // 送信者自身にも届く
  });
  return channel;
}

export function sendHabitLogBroadcast(payload: HabitLogEvent): void {
  const ch = getHabitLogsChannel();
  // supabase-js v2: Channel.send({ type: 'broadcast', event, payload })
  ch.send({ type: "broadcast", event: "habit_log", payload });
}
