// 文件路径: src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt-ts'; // 已更换为兼容Edge环境的 bcrypt-ts
import jwt from 'jsonwebtoken';

// 定义Cloudflare环境变量的类型
interface Env {
  DB: D1Database;
  // 用于签发和验证JWT的密钥，必须在Cloudflare后台设置为一个长而复杂的随机字符串
  JWT_SECRET: string;
}

// 定义前端发送过来的请求体类型
interface LoginRequestBody {
  phoneNumber?: string;
  password?: string;
}

// 声明此函数在Cloudflare的Edge运行时执行
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    const { phoneNumber, password } = await request.json() as LoginRequestBody;

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: '手机号和密码不能为空' }, { status: 400 });
    }

    // 1. 从数据库中查找用户
    const user = await env.DB.prepare('SELECT * FROM users WHERE phone_number = ?').bind(phoneNumber).first<{phone_number: string, hashed_password: string, wallet_address: string}>();
    if (!user) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    // 2. 比较用户输入的密码和数据库中存储的哈希密码
    const isPasswordValid = await compare(password, user.hashed_password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    // 3. 密码验证成功，生成JWT Token
    const token = jwt.sign(
      { phoneNumber: user.phone_number, walletAddress: user.wallet_address },
      env.JWT_SECRET,
      { expiresIn: '7d' } // Token有效期为7天
    );

    // 4. 返回Token和必要的用户信息给前端
    return NextResponse.json({ 
      message: '登录成功', 
      token,
      user: {
        phoneNumber: user.phone_number,
        walletAddress: user.wallet_address
      }
    });

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("Login API Error:", error);
    return NextResponse.json({ error: '服务器内部错误，请稍后重试' }, { status: 500 });
  }
}