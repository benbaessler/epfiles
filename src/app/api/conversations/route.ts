import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://jeffgpt-backend-production.up.railway.app";

export async function GET() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:entry',message:'GET handler called',data:{backendUrl:BACKEND_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:auth',message:'Auth result',data:{userId,hasUserId:!!userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  } catch (authError) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:authError',message:'Auth threw error',data:{error:String(authError)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }

  if (!userId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:noUser',message:'No userId - unauthorized',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendUrl = `${BACKEND_URL}/api/conversations`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:beforeFetch',message:'About to fetch backend',data:{backendUrl,userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const response = await fetch(backendUrl, {
      headers: {
        "X-User-Id": userId,
      },
    });

    const data = await response.json();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:afterFetch',message:'Backend response received',data:{status:response.status,ok:response.ok,data},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      // Backend doesn't support GET for conversations yet - return empty array
      if (response.status === 405) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:405fallback',message:'Backend 405 - returning empty array',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return NextResponse.json([]);
      }
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET:fetchError',message:'Fetch threw error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}


