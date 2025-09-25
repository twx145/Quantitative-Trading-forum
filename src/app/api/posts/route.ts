// 文件路径: src/app/api/posts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// 这是您合约的“说明书”（ABI），后端需要它来理解如何调用合约里的函数。
// 我们只包含了需要用到的部分，以保持代码整洁。
const contractABI = [
  "event PostMinted(uint256 indexed tokenId, address indexed author, string ipfsCid)",
  "function mintPost(address author, string memory ipfsCid) public returns (uint256)"
];

// 定义Cloudflare将会注入的环境变量的类型，让代码更安全、更智能。
interface Env {
  DB: D1Database;
  PRIVATE_KEY: string;
  RPC_URL: string;
  CONTRACT_ADDRESS: string;
}

// 定义前端可能发送过来的两种请求的数据结构
interface Web3PostBody {
  type: 'web3';
  author_address: string;
  content: string;
}

interface Web2PostBody {
  type: 'web2';
  author_address: string;
  content: string;
}

// 两种请求的联合类型
type PostBody = Web3PostBody | Web2PostBody;

// 声明此函数在Cloudflare的Edge运行时执行，这是必须的。
export const runtime = 'edge';

// 处理GET请求，用于获取所有帖子，此部分逻辑与之前基本一致。
export async function GET(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    const ps = env.DB.prepare('SELECT id, author_address, content, post_type, tx_hash, created_at FROM posts ORDER BY created_at DESC');
    const { results } = await ps.all();
    return NextResponse.json({ posts: results });
  } catch (e) {
    const error = e as Error;
    console.error({ error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 处理POST请求，这是本次改造的核心，包含了与联盟链交互的逻辑。
export async function POST(request: NextRequest) {
  try {
    const { env } = request as unknown as { env: Env };
    const body = await request.json() as PostBody;

    // 1. 初始化与联盟链的连接
    //    - JsonRpcProvider: 使用BSN提供的网关地址创建一个连接通道。
    //    - Wallet: 使用您的后端私钥创建一个“签名者”实例，它就是能操作合约的“手”。
    //    - Contract: 将合约地址、说明书(ABI)和签名者组合起来，创建一个可交互的合约对象。
    const provider = new ethers.JsonRpcProvider(env.RPC_URL);
    const signer = new ethers.Wallet(env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(env.CONTRACT_ADDRESS, contractABI, signer);

    // 2. 根据前端请求的类型，执行不同操作
    if (body.type === 'web3') {
      const { author_address, content } = body;
      
      // 3. 后端代替用户铸造NFT
      //    注意：mintPost的第一个参数是用户的钱包地址，但这个交易是由我们后端的signer账户支付和签名的。
      const ipfsCid = `mock-ipfs-cid-for-demo-${Date.now()}`;
      const transaction = await contract.mintPost(author_address, ipfsCid);
      
      //    等待交易在链上被确认
      const receipt = await transaction.wait();

      // 4. 将链上成功的证据（如交易哈希）存入我们的D1数据库作为缓存
      const ps = env.DB.prepare(
        'INSERT INTO posts (author_address, content, post_type, ipfs_cid, tx_hash) VALUES (?, ?, ?, ?, ?)'
      );
      await ps.bind(author_address, content, 'web3', ipfsCid, receipt.transactionHash).run();
      
      return NextResponse.json({ message: '帖子已成功上链并缓存！', txHash: receipt.transactionHash });

    } else {
      // Web2的普通发帖逻辑保持不变
      const { author_address, content } = body;
      const ps = env.DB.prepare(
        'INSERT INTO posts (author_address, content, post_type) VALUES (?, ?, ?)'
      );
      await ps.bind(author_address, content, 'web2').run();
      return NextResponse.json({ message: '帖子创建成功' });
    }
  } catch (e) {
    const error = e as Error;
    console.error({ error: error.message });
    // 如果上链失败，向前台返回具体的错误信息
    return NextResponse.json({ error: '联盟链交易失败: ' + error.message }, { status: 500 });
  }
}