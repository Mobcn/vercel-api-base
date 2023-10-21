import VHandler, { Result } from '#handler';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/** 模块文件夹路径 */
const moduleDir = join(dirname(fileURLToPath(import.meta.url)), '../../dao');

/**
 * 获取所有模块
 */
export default VHandler.buildGET(() => {
    const moduleList = [];
    readdirSync(moduleDir).forEach((sub) => {
        const subPath = moduleDir + '/' + sub;
        if (sub !== 'database' && statSync(subPath).isDirectory()) {
            moduleList.push(sub);
        }
    });
    return Result.success({ message: '获取模块成功!', data: moduleList });
});
