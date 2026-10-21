"use client";

import { useEffect } from "react";
import { syncGuestDataToServer } from "@/lib/guest-sync";

export function GuestDataSyncTrigger() {
    useEffect(() => {
        // Run once on dashboard mount to merge any pending guest progress
        syncGuestDataToServer().catch(() => {});
    }, []);

    return null;
}
