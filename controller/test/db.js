import DB from '#db';

/**
 * @param {import('#handler').VercelRequest} request
 * @param {import('#handler').VercelResponse} response
 */
export default function handler(request, response) {
    response.setHeader('Content-Type', 'text/html;charset=UTF-8');
    new Promise((resolve, reject) => {
        let flag = false;
        setTimeout(() => !flag && reject(new Error('连接超时!')), 5000);
        DB.connect(() => resolve((flag = true))).catch((error) => reject(error));
    })
        .then(() => response.status(200).end('连接成功！'))
        .catch((error) => response.status(500).end(`连接失败: ${error.message}`));
}
