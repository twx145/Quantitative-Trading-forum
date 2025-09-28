// 这个文件将成为我们项目中所有共享类型的“唯一真相来源”

export interface User {
  id: number;
  public_address: string | null;
}

export interface Post {
  id: number;
  content: string;
  created_at: string;
  author_identifier: string; // [统一] 使用这个字段作为作者的唯一标识
  is_nft: number;
  ipfs_cid: string | null;
  transaction_hash: string | null;
}