import VHandler, { Result } from '#handler';
import { Model } from '#dao/database/APIModel.js';

/**
 * 获取所有自动接口
 */
export default VHandler.buildGETAndAuth(async () =>
    Result.success({ message: '获取接口成功!', data: await Model.find() })
);
