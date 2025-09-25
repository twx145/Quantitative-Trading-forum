// 文件路径: src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 定义Cloudflare环境变量的类型
interface Env {
  DB: D1Database;
  // 用于签发和验证JWT的密钥，必须在Cloudflare后台设置
  JWT_SECRET: string;
}

interface LoginRequestBody {
  phoneNumber?: string;
  password?: string;
}

// 用户在数据库中的数据结构
interface UserRecord {
  phone_number: string;
  hashed_password: string;
  wallet_address: string;
}

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    // 已修复：使用类型断言，明确告诉TS body 的结构
    const { phoneNumber, password } = await request.json() as LoginRequestBody;

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: '手机号和密码不能为空' }, { status: 400 });
    }

    // 1. 根据手机号从数据库查找用户
    const user = await env.DB.prepare('SELECT * FROM users WHERE phone_number = ?').bind(phoneNumber).first<UserRecord>();
    if (!user) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 404 });
    }

    // 2. 验证密码是否匹配
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    // 3. 密码验证成功，生成JWT
    const token = jwt.sign(
      { 
        phoneNumber: user.phone_number, 
        walletAddress: user.wallet_address 
      },
      env.JWT_SECRET,
      { expiresIn: '7d' } // Token有效期为7天
    );

    // 4. 返回Token和部分用户信息给前端
    return NextResponse.json({ 
      message: '登录成功', 
      token,
      user: {
        phoneNumber: user.phone_number,
        walletAddress: user.wallet_address
      }
    });

  } catch (e: unknown) {
    const error = e instanceof Error ? e : { message: 'An unknown error occurred' };
    console.error("登录失败:", error.message);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}