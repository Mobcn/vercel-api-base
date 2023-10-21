/**
 * @template T
 * @typedef {T extends import('mongoose').Model<any, any, any, any, infer U> ? U : unknown} ResultDoc
 */

/**
 * @template T
 * @typedef {T extends import('mongoose').Model<infer U> ? U : unknown} RawDocType
 */

/**
 * 基础数据访问
 *
 * @template {import('mongoose').Model<{ [x: string]: any }, {}>} TModel
 */
class BaseDAO {
    /**
     * 数据模型
     *
     * @type {TModel}
     */
    Model;

    /**
     * @param {TModel} Model 数据模型
     */
    constructor(Model) {
        if (!Model) {
            throw new Error('缺少数据模型参数');
        }
        this.Model = Model;
    }

    /**
     * 获取所有数据
     *
     * @param {Object} param0 参数
     * @param {{ [key in keyof RawDocType<TModel>]: 1 | -1 }} [param0.sort={ create_time: -1 }] 排序
     * @returns {Promise<ResultDoc<TModel>[]>}
     */
    async listAll({ sort = { create_time: -1 } }) {
        return await this.list({ sort });
    }

    /**
     * 获取满足条件的所有数据
     *
     * @param {Object} param0 参数
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} [param0.filter={}] 条件
     * @param {{ [key in keyof RawDocType<TModel>]: 1 | -1 }} [param0.sort={ create_time: -1 }] 排序
     * @returns {Promise<ResultDoc<TModel>[]>}
     */
    async list({ filter = {}, sort = { create_time: -1 } }) {
        return await this.Model.find(filter).sort(sort).exec();
    }

    /**
     * 获取满足条件的分页数据
     *
     * @param {Object} param0 参数
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} [param0.filter={}] 条件
     * @param {number} [param0.page=1] 页数
     * @param {number} [param0.limit=10] 每页数据条数
     * @param {{ [key in keyof RawDocType<TModel>]: 1 | -1 }} [param0.sort={ create_time: -1 }] 排序
     * @returns {Promise<{ list: ResultDoc<TModel>[]; total: number }>}
     */
    async page({ filter = {}, page = 1, limit = 10, sort = { create_time: -1 } }) {
        const [list, total] = await Promise.all([
            this.Model.find(filter)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort(sort)
                .exec(),
            this.Model.count(filter)
        ]);
        return { list, total };
    }

    /**
     * 获取满足条件的一条数据
     *
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} filter 查询条件
     * @returns {Promise<ResultDoc<TModel>>}
     */
    async get(filter) {
        return await this.Model.findOne(filter).exec();
    }

    /**
     * 获取主键ID对应的数据
     *
     * @param {any} id 主键ID
     * @returns {Promise<ResultDoc<TModel>>}
     */
    async getById(id) {
        return await this.Model.findById(id).exec();
    }

    /**
     * 获取满足条件数据的总数量
     *
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} filter 查询条件
     */
    async count(filter) {
        return await this.Model.count(filter);
    }

    /**
     * 判断是否存在满足条件的数据
     *
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} filter 查询条件
     */
    async exists(filter) {
        return (await this.Model.exists(filter)) !== null;
    }

    /**
     * 添加
     *
     * @param {RawDocType<TModel>} inserData 添加的数据
     * @returns {Promise<ResultDoc<TModel>>}
     */
    async insert(inserData) {
        const insertModel = new this.Model(inserData);
        return await insertModel.save();
    }

    /**
     * 批量添加
     *
     * @param {RawDocType<TModel>[]} inserDataList 添加的数据列表
     * @returns {Promise<ResultDoc<TModel>[]>}
     */
    async insertBatch(inserDataList) {
        return await this.Model.insertMany(inserDataList);
    }

    /**
     * 删除
     *
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} filter 删除条件
     */
    async delete(filter) {
        return await this.Model.deleteMany(filter);
    }

    /**
     * 删除主键ID对应的数据
     *
     * @param {any | any[]} id 主键ID
     * @returns {Promise<ResultDoc<TModel>>}
     */
    async deleteById(id) {
        return await this.Model.deleteMany({ _id: { $in: id instanceof Array ? id : [id] } });
    }

    /**
     * 更新
     *
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} filter 更新的条件
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} update 更新的数据
     */
    async update(filter, update) {
        if (this.Model.schema.obj.update_time?.type === Date) {
            update.update_time = new Date();
        }
        return await this.Model.updateMany(filter, { $set: update });
    }

    /**
     * 更新主键ID对应的数据
     *
     * @param {any} id 主键ID
     * @param {import('mongoose').FilterQuery<RawDocType<TModel>>} update 更新的数据
     * @returns {Promise<ResultDoc<TModel>>}
     */
    async updateById(id, update) {
        if (this.Model.schema.obj.update_time?.type === Date) {
            update.update_time = new Date();
        }
        return await this.Model.findByIdAndUpdate(id, { $set: update });
    }
}

export { BaseDAO };
