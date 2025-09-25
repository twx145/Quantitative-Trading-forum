// src/app/api/posts/route.ts

import { NextRequest, NextResponse } from 'next/server';

// 定义Cloudflare运行时环境的类型
// 这是让TypeScript知道`env.DB`存在的关键
export interface Env {
  DB: D1Database;
}

// Next.js 会自动将这个文件识别为Edge Function
// 从而让我们可以访问Cloudflare的运行时环境
export const runtime = 'edge';

// 处理GET请求 (获取所有帖子)
export async function GET(request: NextRequest) {
  try {
    const { env } = request as any; // 获取环境绑定
    const ps = env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC');
    const { results } = await ps.all();
    return NextResponse.json({ posts: results });
  } catch (e: any) {
    console.error({ e });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 处理POST请求 (创建新帖子)
export async function POST(request: NextRequest) {
  try {
    const { env } = request as any; // 获取环境绑定
    const { author, content } = await request.json();

    if (!author || !content) {
      return NextResponse.json({ error: 'Author and content are required' }, { status: 400 });
    }

    const ps = env.DB.prepare('INSERT INTO posts (author, content) VALUES (?, ?)');
    await ps.bind(author, content).run();
    
    return NextResponse.json({ message: 'Post created successfully' }, { status: 201 });
  } catch (e: any) {
    console.error({ e });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}