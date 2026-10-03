import start from './story.js?v=9';
export const meta = { id: 'newbook_b', title: '신상책', api: 1 };
export default (map, params = {}) => start(map, { ...params, ep: 'newbook_b' });
