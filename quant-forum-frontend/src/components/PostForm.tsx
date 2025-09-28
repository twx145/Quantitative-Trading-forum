import React, { useState, type FormEvent } from 'react';

interface PostFormProps {
  onSubmit: (content: string, isNft: boolean) => Promise<void>;
  userHasWallet: boolean;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit, userHasWallet }) => {
  const [content, setContent] = useState('');
  const [isNftChecked, setIsNftChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('内容不能为空');
      return;
    }
    setIsSubmitting(true);
    await onSubmit(content, isNftChecked);
    // 提交后重置状态，无论成功与否，父组件会处理后续
    setContent('');
    setIsNftChecked(false);
    setIsSubmitting(false);
  };

  return (
    <section className="card post-form-card">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的见解，交流量化策略..."
          disabled={isSubmitting}
        />
        <div className="post-form-footer">
            <label className="nft-checkbox">
                <input
                type="checkbox"
                checked={isNftChecked}
                onChange={(e) => setIsNftChecked(e.target.checked)}
                />
                {/* 新增这个span */}
                <span className="checkbox-visual"></span>
                <span>铸造为数字藏品 (NFT)</span>
                {!userHasWallet && isNftChecked && 
                <span className="tooltip">需要先生成钱包</span>}
            </label>
            <button type="submit" className="button" disabled={isSubmitting}>
                {isSubmitting ? '发布中...' : '发布'}
            </button>
            </div>
      </form>
    </section>
  );
};

export default PostForm;