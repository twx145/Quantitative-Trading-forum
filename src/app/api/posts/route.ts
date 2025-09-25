// 文件路径: src/app/api/posts/route.ts (已修复致命错误)
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

// --- 类型与常量定义 ---
const contractABI = ["function mintPost(address author, string memory ipfsCid) public returns (uint256)"];
interface Env {
  DB: D1Database;
  RPC_URL: string;
  CONTRACT_ADDRESS: string;
  JWT_SECRET: string;
  ENCRYPTION_SECRET: string;
}
interface AuthPayload { phoneNumber: string; walletAddress: string; }
type PostBody = { type: 'web2' | 'web3'; content: string; };
export const runtime = 'edge';

// --- 认证中间件函数 ---
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
    const ps = env.DB.prepare('SELECT id, author_address, content, post_type, tx_hash, created_at FROM posts ORDER BY created_at DESC');
    const results = await ps.all();
    return NextResponse.json({ posts: results });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("GET Posts Error:", error);
    return NextResponse.json({ error: "无法从数据库加载帖子: " + error }, { status: 500 });
  }
}

// --- POST 请求 (需要认证) ---
export async function POST(request: NextRequest) {
  const { env } = request as unknown as { env: Env };
  
  const userInfo = await verifyAuth(request, env);
  if (!userInfo) {
    return NextResponse.json({ error: '未经授权的访问，请先登录' }, { status: 401 });
  }

  try {
    const body = await request.json() as PostBody;

    if (body.type === 'web2') {
      const ps = env.DB.prepare('INSERT INTO posts (author_address, content, post_type) VALUES (?, ?, ?)');
      await ps.bind(userInfo.walletAddress, body.content, 'web2').run();
      return NextResponse.json({ message: '帖子创建成功' }, { status: 201 });
    }

    if (body.type === 'web3') {
      const user = await env.DB.prepare('SELECT encrypted_private_key FROM users WHERE phone_number = ?').bind(userInfo.phoneNumber).first<{encrypted_private_key: string}>();
      if (!user) {
        throw new Error("用户数据异常，请重新登录");
      }

      // 已修复：实现真正的、可逆的AES解密逻辑
      const bytes = AES.decrypt(user.encrypted_private_key, env.ENCRYPTION_SECRET);
      const decryptedPrivateKey = bytes.toString(Utf8);

      if (!decryptedPrivateKey.startsWith('0x')) {
        throw new Error("私钥解密失败，请联系管理员");
      }
      
      const provider = new ethers.JsonRpcProvider(env.RPC_URL);
      const userSigner = new ethers.Wallet(decryptedPrivateKey, provider);

      if(userSigner.address.toLowerCase() !== userInfo.walletAddress.toLowerCase()) {
         throw new Error("安全校验失败：解密出的钱包地址与用户身份不匹配");
      }
      
      const contract = new ethers.Contract(env.CONTRACT_ADDRESS, contractABI, userSigner);
      const ipfsCid = `mock-cid-for-${userInfo.walletAddress}-${Date.now()}`;
      const transaction = await contract.mintPost(userInfo.walletAddress, ipfsCid);
      const receipt = await transaction.wait();

      await env.DB.prepare(
        'INSERT INTO posts (author_address, content, post_type, ipfs_cid, tx_hash) VALUES (?, ?, ?, ?, ?)'
      ).bind(userInfo.walletAddress, body.content, 'web3', ipfsCid, receipt.transactionHash).run();
      
      return NextResponse.json({ message: '上链成功！', txHash: receipt.transactionHash }, { status: 201 });
    }
    
    return NextResponse.json({ error: '无效的帖子类型' }, { status: 400 });

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("POST Posts Error:", error);
    return NextResponse.json({ error: '操作失败: ' + error }, { status: 500 });
  }
}