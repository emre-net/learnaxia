import prisma from "@/lib/prisma";
import { resolveTrueFalseAnswer } from "@learnaxia/shared";

export async function startDailyStudySession(userId: string) {
    const now = new Date();

    const dueProgressRecords = await prisma.sM2Progress.findMany({
        where: {
            userId,
            nextReviewAt: { lte: now },
            isRetired: false,
        },
        include: {
            item: true,
        },
        orderBy: {
            nextReviewAt: "asc",
        },
        take: 100,
    });

    if (dueProgressRecords.length === 0) {
        return null;
    }

    const items = dueProgressRecords.map((p) => p.item);
    const distinctModuleIds = Array.from(new Set(items.map((item) => item.moduleId)));

    // Create one LearningSession per distinct moduleId so ProgressService validates every item authentically
    const createdSessions = await Promise.all(
        distinctModuleIds.map((moduleId) =>
            prisma.learningSession.create({
                data: {
                    userId,
                    moduleId,
                    startedAt: now,
                },
                select: {
                    id: true,
                    moduleId: true,
                },
            })
        )
    );

    const sessionMap: Record<string, string> = {};
    for (const s of createdSessions) {
        sessionMap[s.moduleId] = s.id;
    }

    const primarySessionId = sessionMap[items[0].moduleId] || createdSessions[0].id;

    const formattedItems = items.map((item) => {
        const content = { ...(item.content as Record<string, any>) };
        let type: string = item.type;

        if (type === "MULTIPLE_CHOICE") type = "MC";
        if (type === "GAP_FILL") type = "GAP";

        if (type === "TRUE_FALSE") {
            const tfText = content.statement || content.Statement || content.question || content.Question || content.text || "";
            const tfBool = resolveTrueFalseAnswer(content);
            content.statement = tfText;
            content.question = tfText;
            content.isTrue = tfBool;
            content.answer = tfBool ? "True" : "False";
        } else if (type === "FLASHCARD") {
            if (!content.question && content.front) content.question = content.front;
            if (!content.front && content.question) content.front = content.question;
            if (!content.answer && content.back) content.answer = content.back;
            if (!content.back && content.answer) content.back = content.answer;
        }

        return {
            id: item.id,
            type,
            moduleId: item.moduleId,
            sessionId: sessionMap[item.moduleId] || primarySessionId,
            content,
        };
    });

    return {
        sessionId: primarySessionId,
        sessionMap,
        items: formattedItems,
        resumedFromIndex: 0,
    };
}
