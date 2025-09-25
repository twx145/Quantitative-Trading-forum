// 文件路径: src/app/api/auth/register/route.ts (加固版)
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import bcrypt from 'bcryptjs';

interface Env {
  DB: D1Database;
  ENCRYPTION_SECRET: string; 
}
interface RegisterRequestBody {
  phoneNumber?: string;
  password?: string;
}

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };

    // --- 新增：环境变量前置检查 ---
    // 这段代码会在执行核心逻辑前，先确认所有需要的环境变量都已配置。
    if (!env.DB || !env.ENCRYPTION_SECRET) {
      console.error("服务器环境变量配置不完整！缺失 DB 或 ENCRYPTION_SECRET。");
      // 返回一个对开发者更友好的错误信息
      return NextResponse.json({ error: '服务器配置错误，请联系管理员' }, { status: 500 });
    }
    // -----------------------------

    const { phoneNumber, password } = await request.json() as RegisterRequestBody;

    if (!phoneNumber || !password || password.length < 6) {
      return NextResponse.json({ error: '手机号和密码不能为空，且密码至少6位' }, { status: 400 });
    }

    const existingUser = await env.DB.prepare('SELECT phone_number FROM users WHERE phone_number = ?').bind(phoneNumber).first();
    if (existingUser) {
      return NextResponse.json({ error: '该手机号已被注册' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const wallet = ethers.Wallet.createRandom();

    // ！！！此处的加密方式仅为演示，请勿直接用于生产 ！！！
    const encryptedPrivateKey = ethers.id(wallet.privateKey + env.ENCRYPTION_SECRET);

    await env.DB.prepare(
      'INSERT INTO users (phone_number, hashed_password, wallet_address, encrypted_private_key) VALUES (?, ?, ?, ?)'
    ).bind(phoneNumber, hashedPassword, wallet.address, encryptedPrivateKey).run();

    return NextResponse.json({ message: '注册成功', walletAddress: wallet.address }, { status: 201 });

  } catch (e: unknown) {
    // 保持详细的日志输出
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("注册API未知错误:", error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}