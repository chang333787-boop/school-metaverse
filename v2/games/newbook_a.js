import start from './story.js?v=10';
export const meta = { id: 'newbook_a', title: '신상책', api: 1 };
export default (map, params = {}) => start(map, { ...params, ep: 'newbook_a' });
