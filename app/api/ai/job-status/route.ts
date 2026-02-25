
export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { getAiQueue } from "@/lib/queue/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get("jobId");

        if (!jobId) {
            return NextResponse.json({ error: "jobId is required" }, { status: 400 });
        }

        const job = await getAiQueue().getJob(jobId);

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Security check: only the owner of the job can see it
        if (job.data.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const state = await job.getState();
        const result = job.returnvalue;
        const progress = job.progress;

        return NextResponse.json({
            id: job.id,
            state,
            progress,
            result,
            failedReason: job.failedReason,
        });

    } catch (error) {
        console.error("Job Status API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
