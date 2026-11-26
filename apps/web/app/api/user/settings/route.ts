import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMobileUser } from "@/lib/auth/mobile-jwt";
import { getUserSettings, mergeUserSettings } from "@/lib/user-settings";
import { z } from "zod";

const SettingsPatchSchema = z.object({
    soundEnabled: z.boolean().optional(),
    showStudyTimer: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    inAppNotifications: z.boolean().optional(),
    moduleNotifications: z.boolean().optional(),
});

async function resolveUserId(req: Request): Promise<string | null> {
    const mobileUser = await getMobileUser(req);
    if (mobileUser?.id) return mobileUser.id;
    const session = await auth();
    return session?.user?.id || null;
}

export async function GET(req: Request) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settings = await getUserSettings(userId);
        return NextResponse.json({
            soundEnabled: settings.soundEnabled ?? true,
            showStudyTimer: settings.showStudyTimer ?? true,
            emailNotifications: settings.emailNotifications ?? true,
            inAppNotifications: settings.inAppNotifications ?? true,
            moduleNotifications: settings.moduleNotifications ?? true,
        });
    } catch (error) {
        console.error("[USER_SETTINGS_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const userId = await resolveUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const patch = SettingsPatchSchema.parse(body);

        const updated = await mergeUserSettings(userId, (curr) => ({
            ...curr,
            ...patch,
        }));

        return NextResponse.json({
            soundEnabled: updated.soundEnabled ?? true,
            showStudyTimer: updated.showStudyTimer ?? true,
            emailNotifications: updated.emailNotifications ?? true,
            inAppNotifications: updated.inAppNotifications ?? true,
            moduleNotifications: updated.moduleNotifications ?? true,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        console.error("[USER_SETTINGS_PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
