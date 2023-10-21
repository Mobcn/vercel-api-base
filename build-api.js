import fs from 'fs';

const srcPath = './controller';
const destPath = './api/index.js';

const router = {};
listController(srcPath).forEach((path) => {
    const key = path.substring(srcPath.length, path.length - 3);
    const value = `'() => import('${path.replace('./', '#')}')'`;
    router[key] = value;
});
const routerCode = getApiTemplate(JSON.stringify(router, null, 4).replace(/"/g, "'").replace(/''/g, ''));
fs.writeFileSync(destPath, routerCode);

/**
 * 获取controller文件路径列表
 *
 * @param {string} path 路径
 * @param {string[]} [list=[]] 文件路径列表
 */
function listController(path, list = []) {
    fs.readdirSync(path).forEach((sub) => {
        const subPath = path + '/' + sub;
        if (fs.statSync(subPath).isFile()) {
            list.push(subPath);
        } else {
            listController(subPath, list);
        }
    });
    return list;
}

/**
 * 获取Api文件模板
 *
 * @param {string} routerCode 路径代码
 */
function getApiTemplate(routerCode) {
    return `/** @typedef {import("#handler").VercelRequest} VercelRequest */
/** @typedef {import("#handler").VercelResponse} VercelResponse */
/** @typedef {(request: VercelRequest, response: VercelResponse) => void} VercelHandler */

/**
 * @type {{ [path: string]: () => Promise<{ default: VercelHandler }> }}
 */
const router = ${routerCode};

/**
 * @param {VercelRequest} request 请求对象
 * @param {VercelResponse} response 响应对象
 */
export default function handler(request, response) {
    const { pathname } = new URL(request.url, 'http://' + request.headers.host);
    if (Object.keys(router).includes(pathname)) {
        router[pathname]()
            .then(({ default: handler }) => handler(request, response))
            .catch((error) => response.status(500).end(error.message));
    } else {
        import('#dao/database/APIModel.js')
            .then(async ({ Model: APIModel }) => {
                const paths = pathname.split('/');
                if (paths.length > 3) {
                    import('#db').then(({ default: DB }) => DB.connect());
                    const module = paths[1];
                    const model = paths[2][0].toUpperCase() + paths[2].substring(1);
                    const path = '/' + paths.slice(3).join('/');
                    const api = await APIModel.findOne({ module, model, path, status: true }).exec();
                    if (api) {
                        const [[VHandler, Result], Model] = await Promise.all([
                            import('#handler').then(({ default: VHandler, Result }) => [VHandler, Result]),
                            import('#dao/' + api.module + '/model/' + model + 'Model.js').then(({ Model }) => Model)
                        ]);
                        const handler = VHandler.config({
                            methods: api.method,
                            authorized: api.authorized
                        }).build(eval('(Model, Result) => ' + api.handler)(Model, Result));
                        handler(request, response);
                        return;
                    }
                }
                response.status(404).end();
            })
            .catch((error) => response.status(500).end(error.message));
    }
}
`;
}
