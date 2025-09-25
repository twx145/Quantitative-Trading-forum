// sm2-signer.js

// 导入sm-crypto库中的sm2模块
const { sm2 } = require('sm-crypto');

// --- 请在这里修改 ---

// 1. 替换成您从BSN下载或生成的私钥。
//    重要：必须是64位的十六进制字符串，并且不要带 '0x' 前缀！
//    如果您的私钥带有 '0x'，请手动删除它。
const privateKey = '364b1197809c4fe4f1a152c849cb6a9f2323f4eb90c856a2be4fb76d8ec8b060';

// 2. 替换成BSN页面上“输入测试数据”框里的完整内容。
const messageToSign = '1';

// --- 修改结束 ---


function generateSm2Signature() {
  if (privateKey === 'YOUR_PRIVATE_KEY_WITHOUT_0x_PREFIX' || messageToSign === 'THE_TEST_DATA_FROM_BSN_HERE') {
    console.error("\n❌ 错误：请先在脚本中填入你的私钥和测试数据！");
    return;
  }

  if (privateKey.startsWith('0x')) {
    console.error("\n❌ 错误：私钥不能以 '0x' 开头，请删除它。");
    return;
  }
  
  if (privateKey.length !== 64) {
    console.error(`\n❌ 错误：私钥长度不正确。期望长度为64，当前为 ${privateKey.length}。`);
    return;
  }

  try {
    // SM2签名通常需要公钥，我们先从私钥生成公钥
    const publicKey = sm2.getPublicKeyFromPrivateKey(privateKey);

    // 使用sm2.doSignature进行签名
    // 它需要三个参数：消息、私钥、和一个包含公钥的选项对象
    // 最后的 '1' 表示使用默认的 userID 进行签名，这对于BSN验证通常是必需的
    const signature = sm2.doSignature(messageToSign, privateKey, {
        hash: true, // 表示先对message进行SM3哈希，再签名
        publicKey: publicKey, // 传入公钥
    });

    console.log("\n✅ SM2签名生成成功！");
    console.log("\n请复制下面的签名数据，粘贴到BSN页面的“签名数据”框中：");
    console.log("======================================================");
    console.log(signature);
    console.log("======================================================");

  } catch (error) {
    console.error("\n❌ 生成签名时出错:", error.message);
  }
}

generateSm2Signature();