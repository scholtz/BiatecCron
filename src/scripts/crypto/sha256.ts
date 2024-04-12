import { createHash } from 'node:crypto';

const sha256 = (data: string) => {
  return createHash('sha256').update(data).digest('hex');
};
export default sha256;
