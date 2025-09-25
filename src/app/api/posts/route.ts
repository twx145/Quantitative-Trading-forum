// 文件路径: src/app/api/posts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

// --- 类型与常量定义 ---
const contractABI = ["function mintPost(address author, string memory ipfsCid) public returns (uint256)"];

interface Env {
  DB: D1Database;
  RPC_URL: string;
  CONTRACT_ADDRESS: string;
  JWT_SECRET: string;
  ENCRYPTION_SECRET: string;
}

// JWT Token解码后的用户信息结构
interface AuthPayload { 
  phoneNumber: string; 
  walletAddress: string; 
}

// 前端发送的POST请求体结构
type PostBody = { 
  type: 'web2' | 'web3'; 
  content: string; 
};

export const runtime = 'edge';

// 与注册接口中相同的“解密”函数
// 警告：这不安全，请勿在生产环境中使用！
function simpleXorDecrypt(encryptedBase64: string, secret: string): string {
  const binaryString = Buffer.from(encryptedBase64, 'base64').toString('binary');
  let result = '';
  for (let i = 0; i < binaryString.length; i++) {
    result += String.fromCharCode(binaryString.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return result;
}

// --- 认证中间件函数 ---
// 从请求头中解析并验证JWT
async function verifyAuth(request: NextRequest, env: Env): Promise<AuthPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch (error) {
    return null;
  }
}

// --- GET 请求 (公开) ---
export async function GET(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    const ps = env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC');
    const { results } = await ps.all();
    return NextResponse.json({ posts: results });
  } catch (e: unknown) { /* ... 错误处理 ... */ }
}

// --- POST 请求 (需要认证) ---
export async function POST(request: NextRequest) {
  const { env } = request as unknown as { env: Env };
  
  // 1. 验证用户身份
  const userInfo = await verifyAuth(request, env);
  if (!userInfo) {
    return NextResponse.json({ error: '用户未登录或登录已过期' }, { status: 401 });
  }

  const body = await request.json() as PostBody;

  try {
    // 2. 处理普通帖子发布
    if (body.type === 'web2') {
      const ps = env.DB.prepare('INSERT INTO posts (author_address, content, post_type) VALUES (?, ?, ?)');
      await ps.bind(userInfo.walletAddress, body.content, 'web2').run();
      return NextResponse.json({ message: '帖子创建成功' }, { status: 201 });
    }

    // 3. 处理上链存证的帖子
    if (body.type === 'web3') {
      // 3.1 从数据库获取用户的加密私钥
      const user = await env.DB.prepare('SELECT encrypted_private_key FROM users WHERE phone_number = ?').bind(userInfo.phoneNumber).first<{encrypted_private_key: string}>();
      if (!user) throw new Error("用户数据异常，无法找到私钥");

      // 3.2 解密私钥
      const decryptedPrivateKey = simpleXorDecrypt(user.encrypted_private_key, env.ENCRYPTION_SECRET);
      
      // 3.3 使用用户的私钥创建签名者，连接到联盟链
      const provider = new ethers.JsonRpcProvider(env.RPC_URL);
      const userSigner = new ethers.Wallet(decryptedPrivateKey, provider);
      
      // 安全校验：确保解密后的地址与用户信息匹配
      if(userSigner.address !== userInfo.walletAddress) {
         throw new Error("私钥解密失败或数据不匹配，禁止操作！");
      }

      // 3.4 与智能合约交互
      const contract = new ethers.Contract(env.CONTRACT_ADDRESS, contractABI, userSigner);
      const ipfsCid = `mock-cid-for-${body.content.slice(0, 10)}-${Date.now()}`;
      const transaction = await contract.mintPost(userInfo.walletAddress, ipfsCid);
      const receipt = await transaction.wait();

      // 3.5 将上链证据存入数据库
      await env.DB.prepare('INSERT INTO posts (author_address, content, post_type, ipfs_cid, tx_hash) VALUES (?, ?, ?, ?, ?)')
        .bind(userInfo.walletAddress, body.content, 'web3', ipfsCid, receipt.transactionHash).run();
      
      return NextResponse.json({ message: '上链存证成功！', txHash: receipt.transactionHash }, { status: 201 });
    }
    
    return NextResponse.json({ error: '无效的帖子类型' }, { status: 400 });

  } catch (e: unknown) {
    const error = e instanceof Error ? e : { message: 'An unknown error occurred' };
    console.error("发帖失败:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}