import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const IPLOCATE_API_KEY = process.env.IPLOCATE_API_KEY;

export async function GET(req: NextRequest) {
  try {
    // Get the user's IP from headers (works on Vercel and other platforms)
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

    if (!IPLOCATE_API_KEY) {
      return NextResponse.json(
        { error: "Geolocation API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://www.iplocate.io/api/lookup/${ip}?apikey=${IPLOCATE_API_KEY}`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      // Fallback: try without specific IP (uses requester's IP)
      const fallbackResponse = await fetch(
        `https://www.iplocate.io/api/lookup/?apikey=${IPLOCATE_API_KEY}`,
        {
          headers: { Accept: "application/json" },
        }
      );

      if (!fallbackResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch geolocation data" },
          { status: 502 }
        );
      }

      const data = await fallbackResponse.json();
      return NextResponse.json(data);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geolocation API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch geolocation data" },
      { status: 500 }
    );
  }
}
