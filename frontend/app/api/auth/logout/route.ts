import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;
    console.log("[Logout Proxy] Request body:", JSON.stringify(body));
    console.log("[Logout Proxy] API_BASE_URL:", API_BASE_URL);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/auth/logout/${userId}`, {
        method: "POST",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log("[Logout Proxy] Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.log("[Logout Proxy] Response text:", text);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: "Error al cerrar sesión" };
      }
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout proxy error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { message: "Timeout conectando con el servidor" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { message: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}