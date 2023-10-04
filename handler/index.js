import DB from '#db';
import jsonwebtoken from 'jsonwebtoken';

/** @typedef {import('http').IncomingMessage} IncomingMessage 消息 */
/** @typedef {import('http').ServerResponse} ServerResponse 响应 */
/** @typedef {{ [key: string]: string }} VercelRequestCookies Vercel请求Cookie */
/** @typedef {{ [key: string]: string | string[] }} VercelRequestQuery Vercel请求参数 */
/** @typedef {any} VercelRequestBody Vercel请求体 */
/** @typedef {(body: any) => VercelResponse} SendFun 发送响应 */
/** @typedef {(jsonBody: any) => VercelResponse} JSONFun 响应JSON */
/** @typedef {(statusCode: number) => VercelResponse} StatusFun 响应状态设置 */
/** @typedef {(statusOrUrl: string | number, url?: string) => VercelResponse} RedirectFun 重定向 */
/** @typedef {IncomingMessage & { query: VercelRequestQuery; cookies: VercelRequestCookies; body: VercelRequestBody; }} VercelRequest Vercel请求 */
/** @typedef {ServerResponse & { send: SendFun; json: JSONFun; status: StatusFun; redirect: RedirectFun; }} VercelResponse Vercel响应 */

/**
 * @typedef {{
 *     methods?: string | string[],
 *     authorized?: boolean
 * }} VHandlerSetting 请求处理器设置
 */

/**
 * 请求处理器
 */
class VHandler {
    /** @type {VHandlerSetting} */
    setting = {};

    /**
     * 请求处理创建
     *
     * @param {(query: VercelRequestQuery, request: VercelRequest, response: VercelResponse) => any} controller 控制器
     */
    build(controller) {
        return VHandler.build(controller, this.setting);
    }

    /**
     * 请求处理器设置配置
     *
     * @param {VHandlerSetting} setting 请求处理器设置
     */
    static config(setting) {
        const vHandler = new VHandler();
        if (setting?.methods) {
            if (typeof setting.methods === 'string') {
                vHandler.setting.methods = setting.methods.toUpperCase();
            } else {
                vHandler.setting.methods = setting.methods.map((m) => m.toUpperCase());
            }
        }
        return vHandler;
    }

    /**
     * GET请求处理创建
     *
     * @param {(query: VercelRequestQuery, request: VercelRequest, response: VercelResponse) => any} controller 控制器
     * @param {VHandlerSetting} setting 请求处理器设置
     */
    static buildGET(controller, setting) {
        return VHandler.build(controller, Object.assign({}, setting, { methods: 'GET' }));
    }

    /**
     * GET请求及认证处理创建
     *
     * @param {(query: VercelRequestQuery & { __token_data__: any }, request: VercelRequest, response: VercelResponse) => any} controller 控制器
     * @param {VHandlerSetting} setting 请求处理器设置
     */
    static buildGETAndAuth(controller, setting) {
        return VHandler.build(controller, Object.assign({}, setting, { methods: 'GET', authorized: true }));
    }

    /**
     * POST请求处理创建
     *
     * @param {(query: VercelRequestQuery, request: VercelRequest, response: VercelResponse) => any} controller 控制器
     * @param {VHandlerSetting} setting 请求处理器设置
     */
    static buildPOST(controller, setting) {
        return VHandler.build(controller, Object.assign({}, setting, { methods: 'POST' }));
    }

    /**
     * POST请求及认证处理创建
     *
     * @param {(query: VercelRequestQuery & { __token_data__: any }, request: VercelRequest, response: VercelResponse) => any} controller 控制器
     * @param {VHandlerSetting} setting 请求处理器设置
     */
    static buildPOSTAndAuth(controller, setting) {
        return VHandler.build(controller, Object.assign({}, setting, { methods: 'POST', authorized: true }));
    }

    /**
     * 请求处理创建
     *
     * @param {(query: VercelRequestQuery, request: VercelRequest, response: VercelResponse) => any} controller 控制器
     * @param {VHandlerSetting} setting 请求处理器设置
     */
    static build(controller, setting) {
        /**
         * 请求方法检查
         *
         * @type {(method: string) => boolean}
         */
        let methodCheck = () => true;
        if (setting?.methods) {
            if (typeof setting.methods === 'string') {
                methodCheck = (method) => method.toUpperCase() === setting.methods;
            } else {
                methodCheck = (method) => setting.methods.includes(method.toUpperCase());
            }
        }
        /**
         * 认证检查
         *
         * @type {(params: any, request: VercelRequest) => boolean}
         */
        let authorizedCheck = () => true;
        if (setting?.authorized) {
            authorizedCheck = (params, request) => {
                const authorization = request.headers['authorization'];
                if (!authorization?.startsWith('Bearer ')) {
                    return false;
                }
                const token = authorization.replace('Bearer ', '');
                let result = true;
                try {
                    params['__token_data__'] = JWT.verify(token);
                } catch (error) {
                    result = false;
                }
                return result;
            };
        }

        /**
         * @param {VercelRequest} request 请求对象
         * @param {VercelResponse} response 响应对象
         */
        return function handler(request, response) {
            if (request.method.toUpperCase() === 'OPTIONS') {
                response.status(200).end();
                return;
            }
            const params = Object.assign({}, request.query, request.body);
            response.setHeader('Content-Type', 'text/html;charset=UTF-8');
            if (!methodCheck(request.method)) {
                response.status(500).end(`非法的请求方法: ${request.method}`);
                return;
            }
            if (!authorizedCheck(params, request)) {
                response.status(401).end('没有权限');
                return;
            }
            new Promise((resolve, reject) => {
                DB.connect().catch((error) => reject(error));
                Promise.resolve(controller(params, request, response))
                    .then((result) => {
                        response.status(200);
                        response.setHeader('Content-Type', 'application/json;charset=UTF-8');
                        if (typeof result === 'object') {
                            response.json(result instanceof Result ? result : Result.success({ data: result }));
                        } else {
                            response.json(Result.success({ data: JSON.stringify(result) }));
                        }
                        resolve();
                    })
                    .catch((error) => reject(error));
            }).catch((error) => {
                response.setHeader('Content-Type', 'application/json;charset=UTF-8');
                response.json(Result.error({ message: error.message }));
            });
        };
    }
}

/**
 * 返回数据对象
 */
export class Result {
    /** 响应码 */
    code;

    /** 响应消息 */
    message;

    /** 响应数据 */
    data;

    /**
     * @param {Object} param0 参数
     * @param {number} [param0.code=0] 响应码
     * @param {string} [param0.message='成功!'] 响应消息
     * @param {any} param0.data 响应数据
     */
    constructor({ code = 0, message = '成功!', data }) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 成功
     *
     * @param {{ code?: number; message?: string; data?: any }} params 结果参数
     */
    static success(params) {
        return new Result(params ?? {});
    }

    /**
     * 错误
     *
     * @param {{ code?: number; message?: string }} params 结果参数
     */
    static error(params) {
        return new Result(Object.assign({ code: -1, message: '失败!' }, params));
    }
}

/**
 * JWT工具
 */
export const JWT = {
    /**
     * JWT签名
     *
     * @param {any} data token数据
     */
    sign: (data) => {
        if (!process.env.JWT_SECRET_KEY) {
            throw new Error('缺少环境变量`JWT_SECRET_KEY`');
        }
        return jsonwebtoken.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    },

    /**
     * JWT校验
     *
     * @param {string} token token
     * @param {boolean} [ignoreExpiration] 是否忽略过期
     */
    verify: (token, ignoreExpiration) => {
        if (!process.env.JWT_SECRET_KEY) {
            throw new Error('缺少环境变量`JWT_SECRET_KEY`');
        }
        const data = jsonwebtoken.verify(token, process.env.JWT_SECRET_KEY, { ignoreExpiration });
        if (ignoreExpiration) {
            delete data['iat'];
            delete data['exp'];
        }
        return data;
    }
};

export default VHandler;
