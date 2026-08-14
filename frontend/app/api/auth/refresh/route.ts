import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Refresh Proxy] Request body:", JSON.stringify(body));
    console.log("[Refresh Proxy] API_BASE_URL:", API_BASE_URL);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log("[Refresh Proxy] Response status:", response.status);
    console.log("[Refresh Proxy] Response headers:", Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log("[Refresh Proxy] Response text:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[Refresh Proxy] Failed to parse JSON:", e);
      return NextResponse.json(
        { message: "Respuesta inválida del servidor" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Refresh proxy error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { message: "Timeout conectando con el servidor" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { message: "Error al refrescar token" },
      { status: 500 }
    );
  }
}