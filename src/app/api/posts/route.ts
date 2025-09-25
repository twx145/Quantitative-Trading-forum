import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

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

async function verifyAuth(request: NextRequest, env: Env): Promise<AuthPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch (error) { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    if (!env || !env.DB) {
      throw new Error("服务器配置错误：D1数据库绑定缺失");
    }
    const ps = env.DB.prepare('SELECT id, author_address, content, post_type, tx_hash, created_at FROM posts ORDER BY created_at DESC');
    const { results } = await ps.all();
    return NextResponse.json({ posts: results });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error("GET Posts Error:", error);
    return NextResponse.json({ error: `无法从数据库加载帖子: ${error}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    if (!env.DB || !env.JWT_SECRET || !env.ENCRYPTION_SECRET || !env.RPC_URL || !env.CONTRACT_ADDRESS) {
      throw new Error("服务器配置错误：环境变量或绑定缺失");
    }
    const userInfo = await verifyAuth(request, env);
    if (!userInfo) {
      return NextResponse.json({ error: '未经授权的访问，请先登录' }, { status: 401 });
    }
    const body = await request.json() as PostBody;
    if (body.type === 'web2') {
      const ps = env.DB.prepare('INSERT INTO posts (author_address, content, post_type) VALUES (?, ?, ?)');
      await ps.bind(userInfo.walletAddress, body.content, 'web2').run();
      return NextResponse.json({ message: '帖子创建成功' }, { status: 201 });
    }
    if (body.type === 'web3') {
      const user = await env.DB.prepare('SELECT encrypted_private_key FROM users WHERE phone_number = ?').bind(userInfo.phoneNumber).first<{encrypted_private_key: string}>();
      if (!user) throw new Error("用户数据异常，请重新登录");

      const bytes = AES.decrypt(user.encrypted_private_key, env.ENCRYPTION_SECRET);
      const decryptedPrivateKey = bytes.toString(Utf8);
      if (!decryptedPrivateKey.startsWith('0x')) throw new Error("私钥解密失败，请联系管理员");
      
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
    return NextResponse.json({ error: `操作失败: ${error}` }, { status: 500 });
  }
}