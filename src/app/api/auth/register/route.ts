// 文件路径: src/app/api/posts/route.ts

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
// 一个独立的函数，用于从请求头中解析和验证JWT Token
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

// --- GET 请求 (公开，无需认证) ---
export async function GET(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    const ps = env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC');
    const { results } = await ps.all();
    return NextResponse.json({ posts: results });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("GET Posts Error:", error);
    return NextResponse.json({ error: '获取帖子列表失败' }, { status: 500 });
  }
}

// --- POST 请求 (需要认证) ---
export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    
    // 1. 验证用户身份
    const userInfo = await verifyAuth(request, env);
    if (!userInfo) {
      return NextResponse.json({ error: '未经授权的访问，请先登录' }, { status: 401 });
    }

    const body = await request.json() as PostBody;

    // --- Web2 普通发帖逻辑 ---
    if (body.type === 'web2') {
      const ps = env.DB.prepare('INSERT INTO posts (author_address, content, post_type) VALUES (?, ?, ?)');
      await ps.bind(userInfo.walletAddress, body.content, 'web2').run();
      return NextResponse.json({ message: '帖子创建成功' }, { status: 201 });
    }

    // --- Web3 上链存证逻辑 ---
    if (body.type === 'web3') {
      // 2. 从数据库获取用户的加密私钥
      const user = await env.DB.prepare('SELECT encrypted_private_key FROM users WHERE phone_number = ?').bind(userInfo.phoneNumber).first<{encrypted_private_key: string}>();
      if (!user) throw new Error("用户数据异常，无法找到私钥");

      // 3. 【核心修复】使用AES解密，恢复出用户的原始私钥
      const bytes = AES.decrypt(user.encrypted_private_key, env.ENCRYPTION_SECRET);
      const decryptedPrivateKey = bytes.toString(Utf8);

      if (!decryptedPrivateKey || !decryptedPrivateKey.startsWith('0x')) {
        throw new Error("私钥解密失败，请检查您的ENCRYPTION_SECRET环境变量是否正确");
      }
      
      // 4. 使用解密出的私钥创建签名者，并连接到联盟链
      const provider = new ethers.JsonRpcProvider(env.RPC_URL);
      const userSigner = new ethers.Wallet(decryptedPrivateKey, provider);

      // 5. 【重要安全校验】确保解密出的钱包地址与用户Token中的地址一致
      if(userSigner.address !== userInfo.walletAddress) {
         throw new Error("安全校验失败：解密出的钱包地址与用户身份不匹配");
      }
      
      // 6. 调用智能合约
      const contract = new ethers.Contract(env.CONTRACT_ADDRESS, contractABI, userSigner);
      const ipfsCid = `mock-ipfs-cid-${Date.now()}`; // 模拟IPFS CID
      const transaction = await contract.mintPost(userInfo.walletAddress, ipfsCid);
      const receipt = await transaction.wait();

      // 7. 将上链成功的记录存入D1数据库
      await env.DB.prepare('INSERT INTO posts (author_address, content, post_type, ipfs_cid, tx_hash) VALUES (?, ?, ?, ?, ?)')
        .bind(userInfo.walletAddress, body.content, 'web3', ipfsCid, receipt.transactionHash).run();
      
      return NextResponse.json({ message: '上链成功！', txHash: receipt.transactionHash });
    }
    
    return NextResponse.json({ error: '无效的帖子类型' }, { status: 400 });

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("POST Post Error:", error);
    return NextResponse.json({ error: '操作失败: ' + error }, { status: 500 });
  }
}