import React from 'react';
import { FiBarChart2, FiDownloadCloud, FiSmartphone } from 'react-icons/fi';
import { FaWindows, FaApple } from 'react-icons/fa';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page-layout">
      {/* 卡片1: 关于 QuantForum 社区 (这部分代码没有变化) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <FiBarChart2 size={40} color="var(--primary-color)" />
          <h2 style={{ margin: 0 }}>关于 QuantForum 社区</h2>
        </div>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary-color)' }}>
          QuantForum 是一个专为量化投研爱好者打造的下一代社区。我们结合了人工智能 (AI) 与 Web3.0 技术，旨在为用户提供一个安全、透明、价值驱动的交流平台。
        </p>
        <h3 style={{ marginTop: '2rem' }}>核心特色</h3>
        <ul style={{ lineHeight: 1.7, color: 'var(--text-secondary-color)' }}>
          <li><strong>策略分享:</strong> 用户可以自由分享和讨论各种量化投资策略。</li>
          <li><strong>价值存证:</strong> 通过文昌链技术，用户可以将自己有价值的分享铸造为独一无二的数字藏品 (NFT)，永久记录在区块链上。</li>
          <li><strong>合规安全:</strong> 我们采用无币化设计，用户无需接触虚拟货币即可体验Web3.0的魅力，确保平台合规、安全。</li>
        </ul>
      </div>

      {/* 卡片2: 软件下载区域 */}
      <div className="card download-card">
        <div className="download-section-grid">
          {/* 左侧：Logo */}
          <div className="download-logo-wrapper">
            <img src="/app-logo.png" alt="QuantTrader App Logo" className="download-app-logo" />
          </div>

          {/* 右侧：介绍与链接 */}
          <div className="download-info-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <FiDownloadCloud size={32} color="var(--primary-color)" />
              <h2 style={{ margin: 0 }}>下载桌面与移动端应用</h2>
            </div>
            <p style={{ lineHeight: 1.7, color: 'var(--text-secondary-color)', marginBottom: '1.5rem' }}>
              体验更强大的功能，下载我们的桌面端应用 QuantTrader。它提供了更专业的图表工具、策略回测引擎以及与社区无缝集成的体验。
            </p>
            <div className="download-buttons-group">
              {/* 替换 '#' 为你的真实下载链接 */}
              <a href="#" className="button download-button">
                {/* [核心修正] 使用正确的组件名称 FaWindows */}
                <FaWindows />
                <span>下载 Windows 版</span>
              </a>
              <a href="#" className="button download-button">
                {/* [核心修正] 使用正确的组件名称 FaApple */}
                <FaApple />
                <span>下载 macOS 版</span>
              </a>
              <a href="#" className="button download-button disabled">
                <FiSmartphone />
                <span>移动端即将推出</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;