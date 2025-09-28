-- 删除旧表以应用新结构
DROP TABLE IF EXISTS Posts;
DROP TABLE IF EXISTS Users;

-- 创建新的用户表
CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL UNIQUE,
    public_address TEXT, -- 用户的链上钱包地址
    encrypted_private_key TEXT, -- 【警告】生产环境必须加密！
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建新的帖子表
CREATE TABLE Posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_nft INTEGER NOT NULL DEFAULT 0, -- 0 = 普通帖子, 1 = NFT
    ipfs_cid TEXT, -- NFT在IPFS上的内容哈希
    transaction_hash TEXT, -- NFT铸造的交易哈希
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);