// 文件路径: src/app/api/posts/route.ts (已重构)
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// --- 类型定义区 ---
const contractABI = [
  "event PostMinted(uint256 indexed tokenId, address indexed author, string ipfsCid)",
  "function mintPost(address author, string memory ipfsCid) public returns (uint256)"
];
interface Env {
  DB: D1Database;
  PRIVATE_KEY: string;
  RPC_URL: string;
  CONTRACT_ADDRESS: string;
}
type PostBody = {
  type: 'web2' | 'web3';
  author_address: string;
  content: string;
};

export const runtime = 'edge';

// --- GET 请求 ---
export async function GET(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    const ps = env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC');
    const { results } = await ps.all();
    return NextResponse.json({ posts: results });
  } catch (e: unknown) {
    const error = e instanceof Error ? e : { message: 'An unknown error occurred' };
    console.error({ error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST 请求 ---
export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    const body = await request.json() as PostBody;

    // --- Web2 普通发帖逻辑 (已修复) ---
    if (body.type === 'web2') {
      const ps = env.DB.prepare(
        'INSERT INTO posts (author_address, content, post_type) VALUES (?, ?, ?)'
      );
      await ps.bind(body.author_address, body.content, 'web2').run();
      return NextResponse.json({ message: '帖子创建成功' }, { status: 201 });
    }

    // --- Web3 上链存证逻辑 ---
    if (body.type === 'web3') {
      // 1. 初始化与联盟链的连接
      const provider = new ethers.JsonRpcProvider(env.RPC_URL);
      const signer = new ethers.Wallet(env.PRIVATE_KEY, provider);
      const contract = new ethers.Contract(env.CONTRACT_ADDRESS, contractABI, signer);
      
      // 2. 去中心化存储（当前为模拟）
      const ipfsCid = `decentralized-storage-cid-for-${body.content.slice(0, 10)}-${Date.now()}`;
      
      // 3. 后端代替用户铸造NFT
      const transaction = await contract.mintPost(body.author_address, ipfsCid);
      const receipt = await transaction.wait();

      // 4. 将链上证据存入D1数据库
      const ps = env.DB.prepare(
        'INSERT INTO posts (author_address, content, post_type, ipfs_cid, tx_hash) VALUES (?, ?, ?, ?, ?)'
      );
      await ps.bind(body.author_address, body.content, 'web3', ipfsCid, receipt.transactionHash).run();
      
      return NextResponse.json({ message: '帖子已成功上链并缓存！', txHash: receipt.transactionHash }, { status: 201 });
    }

    // 如果类型不匹配，返回错误
    return NextResponse.json({ error: '无效的帖子类型' }, { status: 400 });

  } catch (e: unknown) {
    const error = e instanceof Error ? e : { message: 'An unknown error occurred' };
    console.error({ error: error.message });
    return NextResponse.json({ error: '联盟链交易失败: ' + error.message }, { status: 500 });
  }
}