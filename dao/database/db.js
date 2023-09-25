import MongoDB from "#dao/database/mongodb.js";

/**
 * @typedef {Object} DB 数据库
 * @property {(callback: () => void) => Promise<void>} connect 打开数据库连接
 * @property {() => Promise<void>} disconnect 关闭数据库连接
 */

export default MongoDB;