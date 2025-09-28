-- 删除旧表以应用新结构
DROP TABLE IF EXISTS Posts;
DROP TABLE IF EXISTS Users;

-- 创建新的、更安全的用户表
CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_hash TEXT NOT NULL UNIQUE, 
    encrypted_phone_number TEXT NOT NULL, 
    public_address TEXT,
    encrypted_private_key TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 帖子表保持不变
CREATE TABLE Posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_nft INTEGER NOT NULL DEFAULT 0,
    ipfs_cid TEXT,
    transaction_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);