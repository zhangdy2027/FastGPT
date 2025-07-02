import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { getTmbInfoByTmbId } from '@fastgpt/service/support/user/team/controller';

type PermissionInfoBody = {
  username: string;
};

async function handler(req: ApiRequestProps<PermissionInfoBody>): Promise<any> {
  const { username } = req.body;
  const tmbId = await (async () => {
    const user = await MongoUser.findOne({ username });
    if (!user) return Promise.reject('user is not exist');
    const tmb = await MongoTeamMember.findOne({ userId: user._id });
    if (!tmb) return Promise.reject('team member is not exist');
    return String(tmb._id);
  })();

  const { permission: tmbPer } = await getTmbInfoByTmbId({ tmbId });

  return tmbPer;
}

export default NextAPI(handler);
