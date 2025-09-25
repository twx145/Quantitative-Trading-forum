// 文件路径: src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import bcrypt from 'bcryptjs';

// 定义Cloudflare环境变量的类型
interface Env {
  DB: D1Database;
  // 用于对私钥进行基础“加密”的密钥，必须在Cloudflare后台设置
  ENCRYPTION_SECRET: string; 
}

interface RegisterRequestBody {
  phoneNumber?: string;
  password?: string;
}

// 声明此函数在Cloudflare的Edge运行时执行
export const runtime = 'edge';

// 一个极其简化的对称“加密”函数，仅用于演示概念。
// 警告：这不安全，请勿在生产环境中使用！生产环境应使用标准的AES加密库。
function simpleXorEncrypt(text: string, secret: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return Buffer.from(result, 'binary').toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    const { phoneNumber, password } = await request.json() as RegisterRequestBody;

    if (!phoneNumber || !password || password.length < 6) {
      return NextResponse.json({ error: '手机号和密码不能为空，且密码至少6位' }, { status: 400 });
    }

    // 1. 检查手机号是否已存在
    const existingUser = await env.DB.prepare('SELECT phone_number FROM users WHERE phone_number = ?').bind(phoneNumber).first();
    if (existingUser) {
      return NextResponse.json({ error: '该手机号已被注册' }, { status: 409 });
    }

    // 2. 对用户密码进行安全的哈希处理
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 为用户生成一个新的、专属的以太坊钱包
    const wallet = ethers.Wallet.createRandom();
    const walletAddress = wallet.address;
    const privateKey = wallet.privateKey;

    // 4. 对生成的私钥进行“加密”后存储
    const encryptedPrivateKey = simpleXorEncrypt(privateKey, env.ENCRYPTION_SECRET);

    // 5. 将新用户的完整信息存入数据库
    await env.DB.prepare(
      'INSERT INTO users (phone_number, hashed_password, wallet_address, encrypted_private_key) VALUES (?, ?, ?, ?)'
    ).bind(phoneNumber, hashedPassword, walletAddress, encryptedPrivateKey).run();

    return NextResponse.json({ message: '注册成功！', walletAddress: walletAddress }, { status: 201 });

  } catch (e: unknown) {
    const error = e instanceof Error ? e : { message: 'An unknown error occurred' };
    console.error("注册失败:", error.message);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}