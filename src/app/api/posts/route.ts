// src/app/api/posts/route.ts (Updated Again)

import { NextRequest, NextResponse } from 'next/server';

interface Env {
  DB: D1Database;
}

// 新增：定义POST请求体的类型
interface PostBody {
  author: string;
  content: string;
}

export const runtime = 'edge';

// 处理GET请求 (获取所有帖子)
export async function GET(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env }; 
    const ps = env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC');
    const { results } = await ps.all();
    return NextResponse.json({ posts: results });
  } catch (e) {
    const error = e as Error;
    console.error({ error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 处理POST请求 (创建新帖子)
export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env }; 
    
    // FIXED: 使用类型断言 `as PostBody`
    const { author, content } = await request.json() as PostBody;

    if (!author || !content) {
      return NextResponse.json({ error: 'Author and content are required' }, { status: 400 });
    }

    const ps = env.DB.prepare('INSERT INTO posts (author, content) VALUES (?, ?)');
    await ps.bind(author, content).run();
    
    return NextResponse.json({ message: 'Post created successfully' }, { status: 201 });
  } catch (e) {
    const error = e as Error;
    console.error({ error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}