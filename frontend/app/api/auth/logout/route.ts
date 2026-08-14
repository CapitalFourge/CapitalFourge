import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;
    
    const response = await fetch(`${API_BASE_URL}/api/auth/logout/${userId}`, {
      method: "POST",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Error al cerrar sesión" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout proxy error:", error);
    return NextResponse.json(
      { message: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}