import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { hash } from 'bcrypt-ts';
import AES from 'crypto-js/aes';

interface Env {
  DB: D1Database;
  ENCRYPTION_SECRET: string; 
}
interface RegisterRequestBody { phoneNumber?: string; password?: string; }
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    if (!env.DB || !env.ENCRYPTION_SECRET) throw new Error("服务器环境变量配置不完整");

    const { phoneNumber, password } = await request.json() as RegisterRequestBody;
    if (!phoneNumber || !password || password.length < 6) {
      return NextResponse.json({ error: '手机号和密码不能为空，且密码至少6位' }, { status: 400 });
    }

    const existingUser = await env.DB.prepare('SELECT phone_number FROM users WHERE phone_number = ?').bind(phoneNumber).first();
    if (existingUser) {
      return NextResponse.json({ error: '该手机号已被注册' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);
    const wallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = AES.encrypt(wallet.privateKey, env.ENCRYPTION_SECRET).toString();

    await env.DB.prepare(
      'INSERT INTO users (phone_number, hashed_password, wallet_address, encrypted_private_key) VALUES (?, ?, ?, ?)'
    ).bind(phoneNumber, hashedPassword, wallet.address, encryptedPrivateKey).run();

    return NextResponse.json({ message: '注册成功', walletAddress: wallet.address }, { status: 201 });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("Register Error:", error);
    return NextResponse.json({ error: `服务器内部错误: ${error}` }, { status: 500 });
  }
}