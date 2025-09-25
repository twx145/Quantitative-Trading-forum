import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  DB?: D1Database;
  [key: string]: unknown; // 允许任何其他属性
}

export async function GET(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    
    const diagnostics = {
      message: "这是来自服务器的诊断信息",
      timestamp: new Date().toISOString(),
      hasEnvObject: typeof env !== 'undefined',
      envKeys: typeof env !== 'undefined' ? Object.keys(env) : "env对象不存在",
      hasDbBinding: typeof env !== 'undefined' && typeof env.DB !== 'undefined',
      dbBindingType: typeof env !== 'undefined' && typeof env.DB !== 'undefined' ? typeof env.DB : "N/A"
    };

    return NextResponse.json(diagnostics);

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: "在获取诊断信息时发生严重错误",
      details: error
    }, { status: 500 });
  }
}