import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface UserPreferencesSettings {
    soundEnabled?: boolean;
    showStudyTimer?: boolean;
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
    moduleNotifications?: boolean;
    bookmarkedItemIds?: string[];
    journeyProgress?: Record<string, number>;
    [key: string]: unknown;
}

export async function getUserSettings(userId: string): Promise<UserPreferencesSettings> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });
    if (!user?.settings || typeof user.settings !== "object" || Array.isArray(user.settings)) {
        return {};
    }
    return user.settings as UserPreferencesSettings;
}

export async function mergeUserSettings(
    userId: string,
    updater: (current: UserPreferencesSettings) => UserPreferencesSettings
): Promise<UserPreferencesSettings> {
    const current = await getUserSettings(userId);
    const next = updater(current);
    await prisma.user.update({
        where: { id: userId },
        data: { settings: next as Prisma.InputJsonValue },
    });
    return next;
}
