import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ethers } from 'ethers';
import { encrypt, hashText } from './crypto'; 

// 你的智能合约ABI
const contractABI =  [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC721IncorrectOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ERC721InsufficientApproval",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC721InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "ERC721InvalidOperator",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC721InvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC721InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC721InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ERC721NonexistentToken",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "approved",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "ApprovalForAll",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "ipfsCid",
				"type": "string"
			}
		],
		"name": "PostMinted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "getApproved",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "isApprovedForAll",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "ipfsCid",
				"type": "string"
			}
		],
		"name": "mintPost",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "setApprovalForAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes4",
				"name": "interfaceId",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "tokenURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
] ; // 请务必用你自己的完整ABI替换这里

export interface Env {
	DB: D1Database;
	RPC_URL: string;
	CONTRACT_ADDRESS: string;
	GAS_PAYER_PRIVATE_KEY: string;
	ENCRYPTION_KEY: string; // 新增
}

const app = new Hono<{ Bindings: Env }>();
app.use('/*', cors());

// --- 认证 API ---
app.post('/api/register', async (c) => {
	const { phone } = await c.req.json();
	if (!phone) return c.json({ success: false, error: '手机号是必须的' }, 400);

	try {
        const phoneHash = await hashText(phone); // 1. 计算手机号哈希

		const existingUser = await c.env.DB.prepare('SELECT id FROM Users WHERE phone_hash = ?').bind(phoneHash).first();
		if (existingUser) {
			return c.json({ success: false, error: '该手机号已被注册' }, 409);
		}

        const encryptedPhone = await encrypt(phone, c.env); // 2. 加密手机号

		await c.env.DB.prepare(
            'INSERT INTO Users (phone_hash, encrypted_phone_number) VALUES (?, ?)'
        ).bind(phoneHash, encryptedPhone).run(); // 3. 存储哈希和加密值

		const user = await c.env.DB.prepare('SELECT id, public_address FROM Users WHERE phone_hash = ?').bind(phoneHash).first();
		return c.json({ success: true, user });

	} catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

app.post('/api/login', async (c) => {
	const { phone } = await c.req.json();
	if (!phone) return c.json({ success: false, error: '手机号是必须的' }, 400);

    const phoneHash = await hashText(phone); // 使用哈希进行查找

	const user = await c.env.DB.prepare('SELECT id, public_address FROM Users WHERE phone_hash = ?').bind(phoneHash).first();
	if (!user) {
		return c.json({ success: false, error: '用户未注册或手机号错误' }, 404);
	}
	return c.json({ success: true, user });
});

// --- 钱包生成 API (重大更新) ---
app.post('/api/generate-wallet', async (c) => {
	const { userId } = await c.req.json();
	if (!userId) return c.json({ success: false, error: '用户ID是必须的' }, 400);

	try {
		const wallet = ethers.Wallet.createRandom();
		
        // 使用我们的加密服务来加密私钥
        const encryptedPrivateKey = await encrypt(wallet.privateKey, c.env);

		await c.env.DB.prepare(
			'UPDATE Users SET public_address = ?, encrypted_private_key = ? WHERE id = ?'
		).bind(wallet.address, encryptedPrivateKey, userId).run(); // 存储加密后的私钥

		return c.json({ success: true, public_address: wallet.address });
	} catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// --- 【修正】获取所有帖子的API ---
app.get('/api/posts', async (c) => {
	try {
		// [核心修正] 将 JOIN 修改为 LEFT JOIN
		const { results } = await c.env.DB.prepare(
			`SELECT 
                p.id, p.content, p.is_nft, p.ipfs_cid, 
                p.transaction_hash, p.created_at, 
                u.phone_hash as author_identifier
		    FROM Posts p 
            LEFT JOIN Users u ON p.user_id = u.id -- 使用 LEFT JOIN
		    ORDER BY p.created_at DESC`
		).all();

		// [健壮性增强] 处理作者信息可能为NULL的情况
		// 如果作者被删除，phone_hash会是null，我们给一个默认值
		const postsWithAuthor = results.map(post => ({
			...post,
			author_identifier: post.author_identifier || 'unknown_author'
		}));

		return c.json({ success: true, posts: postsWithAuthor });
	} catch (e: any) {
        console.error("获取帖子列表失败:", e);
        return c.json({ success: false, error: '服务器内部错误，无法获取帖子列表' }, 500);
    }
});

// --- 【修正】创建普通帖子的API ---
app.post('/api/posts', async (c) => {
	const { userId, content } = await c.req.json();
	if (!userId || !content || typeof content !== 'string' || content.trim() === '') {
		return c.json({ success: false, error: '缺少用户ID或帖子内容无效' }, 400);
	}

	try {
		// [逻辑修正] .run() 是正确的做法，它只返回操作元信息，效率最高
		const { success } = await c.env.DB.prepare(
			'INSERT INTO Posts (user_id, content, is_nft) VALUES (?, ?, 0)'
		).bind(userId, content.trim()).run();

		if (success) {
			// [策略修正] 不再返回单个帖子，只返回一个明确的成功信号
			// 强制前端去重新获取整个列表，保证数据绝对一致
			return c.json({ success: true, message: '帖子发布成功' }, 201);
		} else {
			return c.json({ success: false, error: '数据库未能保存帖子' }, 500);
		}
	} catch (e: any) {
		console.error("发布普通帖子失败:", e);
		return c.json({ success: false, error: '数据库操作失败: ' + e.message }, 500);
	}
});

// --- NFT 铸造 API ---
app.post('/api/mint', async (c) => {
	const { userId, content, ipfsCid } = await c.req.json();
	if (!userId || !content || !ipfsCid) {
		return c.json({ success: false, error: '缺少必要参数' }, 400);
	}

	try {
		// 1. 获取用户的钱包地址 (NFT的接收者)
		const user: { public_address: string } | null = await c.env.DB.prepare(
			'SELECT public_address FROM Users WHERE id = ?'
		).bind(userId).first();

		if (!user?.public_address) {
			return c.json({ success: false, error: '用户没有钱包地址，无法铸造' }, 400);
		}

		// 2. 初始化EVM提供者和Gas支付钱包
		const provider = new ethers.JsonRpcProvider(c.env.RPC_URL);
		const gasPayerWallet = new ethers.Wallet(c.env.GAS_PAYER_PRIVATE_KEY, provider);
		
		// 3. 实例化智能合约
		const contract = new ethers.Contract(c.env.CONTRACT_ADDRESS, contractABI, gasPayerWallet);

		// 4. 调用合约的 mintPost 方法
        // gasPayerWallet 是交易的发送者 (msg.sender)
        // user.public_address 是NFT的所有者 (author)
		const tx = await contract.mintPost(user.public_address, ipfsCid);
		 const receipt = await tx.wait();

		// [逻辑修正] 同样，只执行插入操作
		const { success } = await c.env.DB.prepare(
			`INSERT INTO Posts (user_id, content, is_nft, ipfs_cid, transaction_hash)
			 VALUES (?, ?, 1, ?, ?)`
		).bind(userId, content.trim(), ipfsCid, receipt.hash).run();

		if (success) {
			// [策略修正] 只返回成功信号和交易哈希
			return c.json({ success: true, transactionHash: receipt.hash });
		} else {
			console.error(`严重错误：用户 ${userId} 的交易 ${receipt.hash} 已上链，但未能写入数据库！`);
			return c.json({ success: false, error: '交易已成功但数据保存失败，请联系管理员' }, 500);
		}
	} catch (e: any){
		console.error("Minting error:", e);
		return c.json({ success: false, error: '铸造过程中发生错误: ' + e.message }, 500);
	}
});


export default app;