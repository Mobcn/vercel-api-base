/**
 * @template T
 * @typedef {T extends import('#dao/BaseDAO').BaseDAO<infer U> ? U : T} ExtractModel
 */

/**
 * @template T
 * @typedef {import("#dao/BaseDAO").RawDocType<T>} RawDocType
 */

/**
 * 基础服务
 *
 * @template {import('#dao/BaseDAO').BaseDAO<TModel>} TDAO
 * @template {import('mongoose').Model} TModel
 */
class BaseService {
    /**
     * 数据访问对象
     *
     * @type {TDAO}
     */
    DAO;

    /**
     * @param {TDAO} DAO 数据访问对象
     */
    constructor(DAO) {
        if (!DAO) {
            throw new Error('缺少数据访问对象');
        }
        this.DAO = DAO;
    }

    /**
     * 获取所有数据
     */
    async listAll() {
        return await this.DAO.listAll();
    }

    /**
     * 获取主键ID对应的数据
     *
     * @param {any} id 主键ID
     */
    async getById(id) {
        return await this.DAO.getById(id);
    }

    /**
     * 添加
     *
     * @param {RawDocType<ExtractModel<TDAO>>} data 添加的数据
     */
    async save(data) {
        return await this.DAO.insert(data);
    }

    /**
     * 删除主键ID对应的数据
     *
     * @param {any} id 主键ID
     */
    async removeById(id) {
        return await this.DAO.deleteById(id);
    }

    /**
     * 更新主键ID对应的数据
     *
     * @param {any} id
     * @param {import('mongoose').FilterQuery<RawDocType<ExtractModel<TDAO>>>} update 更新的数据
     */
    async updateById(id, update) {
        return await this.DAO.updateById(id, update);
    }
}

export { BaseService };
