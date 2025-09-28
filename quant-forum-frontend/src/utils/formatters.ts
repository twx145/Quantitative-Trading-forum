/**
 * 将用户ID格式化为7位数的字符串，不足的前面补0。
 * 例如：formatUserId(123) -> "0000123"
 * @param id - 数字类型的用户ID
 * @returns 格式化后的字符串ID
 */
export function formatUserId(id: number): string {
  // 1. 将数字转换为字符串
  // 2. 使用 padStart 方法，目标长度为7，用 '0' 填充
  return String(id).padStart(7, '0');
}