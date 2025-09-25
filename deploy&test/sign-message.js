const { ethers } = require('ethers');

// --- 请在这里修改 ---
// 1. 替换成你从BSN下载的私钥 (务必以 '0x' 开头)
const privateKey = '';

// 2. 替换成BSN页面上“输入测试数据”框里的内容
const message = '1';
// --- 修改结束 ---


async function signMessage() {
  if (privateKey === 'YOUR_PRIVATE_KEY_HERE' || message === 'THE_TEST_DATA_FROM_BSN_HERE') {
    console.error("错误：请先在脚本中填入你的私钥和测试数据！");
    return;
  }

  try {
    // 创建一个钱包实例
    const wallet = new ethers.Wallet(privateKey);
    
    // 对消息进行签名
    const signature = await wallet.signMessage(message);

    console.log("\n✅ 签名生成成功！");
    console.log("\n请复制下面的签名数据，粘贴到BSN页面的“签名数据”框中：");
    console.log("======================================================");
    console.log(signature);
    console.log("======================================================");

  } catch (error) {
    console.error("\n❌ 生成签名时出错:", error.message);
  }
}

signMessage();