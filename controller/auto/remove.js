import VHandler, { Result } from '#handler';
import { Model } from '#dao/database/APIModel.js';

/**
 * 删除自动接口
 */
export default VHandler.buildPOSTAndAuth(
    /**
     * @param {Object} param0 请求参数
     * @param {string | string[]} param0._id 自动接口ID
     */
    async ({ _id }) =>
        Result.success({
            message: '删除接口成功!',
            data: await Model.deleteMany({ _id: { $in: typeof _id === 'string' ? [_id] : _id } })
        })
);
