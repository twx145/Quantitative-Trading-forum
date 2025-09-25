// /functions/api/posts/[[route]].ts
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

function verifyAuth(req: Request, env: Env): any {
  const h = req.headers.get('Authorization');
  if (!h?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(h.split(' ')[1], env.JWT_SECRET);
  } catch {
    return null;
  }
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { env, request } = ctx;

  if (request.method === 'GET') {
    const ps = env.DB.prepare(
      'SELECT id,author_address,content,post_type,tx_hash,created_at FROM posts ORDER BY created_at DESC'
    );
    const { results } = await ps.all();
    return Response.json({ posts: results });
  }

  if (request.method === 'POST') {
    const user = verifyAuth(request, env);
    if (!user) return Response.json({ error: '未授权' }, { status: 401 });

    const body = await request.json();
    // 下面把你原来的 POST 逻辑原样拷过来即可，略
    return Response.json({ message: 'ok' });
  }

  return new Response('Method Not Allowed', { status: 405 });
};