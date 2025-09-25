import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt-ts';
import jwt from 'jsonwebtoken';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}
interface LoginRequestBody { phoneNumber?: string; password?: string; }
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    if (!env.DB || !env.JWT_SECRET) throw new Error("服务器环境变量配置不完整");

    const { phoneNumber, password } = await request.json() as LoginRequestBody;
    if (!phoneNumber || !password) {
      return NextResponse.json({ error: '手机号和密码不能为空' }, { status: 400 });
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE phone_number = ?').bind(phoneNumber).first<{phone_number: string, hashed_password: string, wallet_address: string}>();
    if (!user) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    const isPasswordValid = await compare(password, user.hashed_password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    const token = jwt.sign(
      { phoneNumber: user.phone_number, walletAddress: user.wallet_address },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ 
      message: '登录成功', 
      token,
      user: { phoneNumber: user.phone_number, walletAddress: user.wallet_address }
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("Login Error:", error);
    return NextResponse.json({ error: `服务器内部错误: ${error}` }, { status: 500 });
  }
}