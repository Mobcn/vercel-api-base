import VHandler, { Result } from '#handler';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/** 模块文件夹路径 */
const moduleDir = join(dirname(fileURLToPath(import.meta.url)), '../../dao');

/**
 * 获取模块下所有模型
 */
export default VHandler.buildGET(async ({ module }) => {
    if (!module) {
        throw new Error('缺少模块名');
    }
    const modelDir = join(moduleDir, module, 'model');
    const modelList = readdirSync(modelDir).filter((sub) => statSync(modelDir + '/' + sub).isFile());
    const models = await Promise.all(
        modelList.map(async (model) => {
            /** @type {{ Model: import('mongoose').Model<{ [x: string]: any }, {}> }} */
            const { Model } = await import(`#dao/${module}/model/${model}`);
            const schema = {};
            for (const key in Model.schema.obj) {
                const prop = Model.schema.obj[key];
                schema[key] = prop.type?.name || prop.name;
            }
            return { name: Model.modelName, schema };
        })
    );
    return Result.success({ message: '获取模型成功!', data: models });
});
