
export const handler = async (event, context) => ({ statusCode: 200, body: JSON.stringify({ ok: true }) });
\nif (typeof module !== 'undefined') { module.exports = { handler }; module.exports.handler = handler; }\n