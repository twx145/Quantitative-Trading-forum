import React from 'react';
import { FiAward } from 'react-icons/fi';
// 1. 导入统一的 Post 类型
import { type Post } from '../types';

// 2. 更新 PostCardProps 的定义
interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formattedDate = new Date(post.created_at).toLocaleString('zh-CN', { /* ... */ });
  
  // 3. 这里的 post.author_identifier 不会再报错
  const anonymousAuthorId = `${post.author_identifier.substring(0, 4)}...${post.author_identifier.substring(post.author_identifier.length - 4)}`;

  return (
    <article className={`card ${post.is_nft ? 'nft-post' : ''}`}>
      <header className="post-card-header">
        <div className="post-card-avatar">{anonymousAuthorId.substring(0, 2)}</div>
        <div className="post-card-author-info">
          <span className="post-card-author">作者: {anonymousAuthorId}</span>
          <time className="post-card-date">{formattedDate}</time>
        </div>
        {post.is_nft === 1 && (
          <div className="nft-badge">
            <FiAward />
            <span>数字藏品</span>
          </div>
        )}
      </header>
      <p className="post-card-content">{post.content}</p>
      {post.is_nft === 1 && (
        <footer className="post-card-nft-footer">
          <a href={`https://ipfs.io/ipfs/${post.ipfs_cid}`} target="_blank" rel="noopener noreferrer">IPFS 源文件</a>
          <span>|</span>
          <span>交易: {post.transaction_hash?.substring(0, 12)}...</span>
        </footer>
      )}
    </article>
  );
};

export default PostCard;