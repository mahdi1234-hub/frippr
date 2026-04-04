import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const AUTOML_API_URL = process.env.AUTOML_API_URL || "https://fastapi-io.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const target = formData.get("target") as string | null;
    const taskType = formData.get("task_type") as string | null;
    const nTop = formData.get("n_top") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Determine which endpoint to call
    let endpoint = "/api/automl";
    if (taskType === "classify") endpoint = "/api/classify";
    else if (taskType === "regress") endpoint = "/api/regress";
    else if (taskType === "cluster") endpoint = "/api/cluster";
    else if (taskType === "anomaly") endpoint = "/api/anomaly";

    // Build form data for the AutoML API
    const apiFormData = new FormData();
    apiFormData.append("file", file);
    if (target) apiFormData.append("target", target);
    if (nTop) apiFormData.append("n_top", nTop);

    const response = await fetch(`${AUTOML_API_URL}${endpoint}`, {
      method: "POST",
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `AutoML API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ML API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ML analysis failed" },
      { status: 500 }
    );
  }
}
