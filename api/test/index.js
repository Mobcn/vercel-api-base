/**
 * @param {import('#handler').VercelRequest} request
 * @param {import('#handler').VercelResponse} response
 */
export default function handler(request, response) {
    response.status(200).json({
        content: 'hello',
        ...request.query
    });
}
