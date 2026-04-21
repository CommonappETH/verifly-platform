import { useSyncExternalStore } from "react";
import { getRequests, subscribe, getConversations } from "./api";

export function useRequests() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => getRequests(),
    () => getRequests(),
  );
}

export function useConversations() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => getConversations(),
    () => getConversations(),
  );
}