import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Login Proxy] Request body:", JSON.stringify(body));
    console.log("[Login Proxy] API_BASE_URL:", API_BASE_URL);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log("[Login Proxy] Response status:", response.status);
    console.log("[Login Proxy] Response headers:", Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log("[Login Proxy] Response text:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[Login Proxy] Failed to parse JSON:", e);
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
    console.error("Login proxy error:", error);
    return NextResponse.json(
      { message: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}