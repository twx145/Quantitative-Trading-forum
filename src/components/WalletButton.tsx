// 文件路径: src/components/WalletButton.tsx
"use client";
import { Wallet } from 'lucide-react';

interface WalletButtonProps {
  account: string | null;
  connectWallet: () => void;
}

export default function WalletButton({ account, connectWallet }: WalletButtonProps) {
  if (account) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-2 px-4 rounded-lg text-sm">
        <p className="text-gray-400">已连接身份:</p>
        <p className="font-mono text-cyan-400">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</p>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
    >
      <Wallet className="w-5 h-5 mr-2" />
      连接钱包以识别身份
    </button>
  );
}