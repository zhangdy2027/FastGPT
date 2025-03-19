import { MongoApp } from '@fastgpt/service/core/app/schema';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import { NextAPI } from '@/service/middleware/entry';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { AppFolderTypeList, AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { AppDefaultPermissionVal } from '@fastgpt/global/support/permission/app/constant';
import { concatPer } from '@fastgpt/service/support/permission/controller';
import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { getOrgIdSetWithParentByTmbId } from '@fastgpt/service/support/permission/org/controllers';
import { addSourceMember } from '@fastgpt/service/support/user/utils';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { parseParentIdInMongo } from '@fastgpt/global/common/parentFolder/utils';

export type ListAppBody = {
  parentId?: ParentIdType;
  type?: AppTypeEnum | AppTypeEnum[];
  searchKey?: string;
  username: string;
};
/*
  获取 APP 列表权限
  1. 校验 folder 权限和获取 team 权限（owner 单独处理）
  2. 获取 team 下所有 app 权限。获取我的所有组。并计算出我所有的app权限。
  3. 过滤我有的权限的 app，以及当前 parentId 的 app（由于权限继承问题，这里没法一次性根据 id 去获取）
  4. 根据过滤条件获取 app 列表
  5. 遍历搜索出来的 app，并赋予权限（继承的 app，使用 parent 的权限）
  6. 再根据 read 权限进行一次过滤。
*/

async function handler(req: ApiRequestProps<ListAppBody>): Promise<AppListItemType[]> {
  const { username, parentId, type, searchKey } = req.body;
  const { tmbId, teamId } = await (async () => {
    const user = await MongoUser.findOne({ username });
    if (!user) return Promise.reject('user is not exist');
    const tmb = await MongoTeamMember.findOne({ userId: user._id });
    if (!tmb) return Promise.reject('team member is not exist');
    return {
      tmbId: String(tmb._id),
      teamId: String(tmb.teamId)
    };
  })();
  console.log('tmbId, teamId>>>', tmbId, teamId);
  // Get team all app permissions
  const [perList, myGroupMap, myOrgSet] = await Promise.all([
    MongoResourcePermission.find({
      resourceType: PerResourceTypeEnum.app,
      teamId,
      resourceId: {
        $exists: true
      }
    }).lean(),
    getGroupsByTmbId({
      tmbId,
      teamId
    }).then((item) => {
      const map = new Map<string, 1>();
      item.forEach((item) => {
        map.set(String(item._id), 1);
      });
      return map;
    }),
    getOrgIdSetWithParentByTmbId({
      teamId,
      tmbId
    })
  ]);
  console.log('perList, myGroupMap, myOrgSet>>>', perList, myGroupMap, myOrgSet);
  // Get my permissions
  const myPerList = perList.filter(
    (item) =>
      String(item.tmbId) === String(tmbId) ||
      myGroupMap.has(String(item.groupId)) ||
      myOrgSet.has(String(item.orgId))
  );
  console.log('myPerList>>>', myPerList);
  const myApps = await MongoApp.find(
    {
      teamId,
      tmbId,
      ...(searchKey ? { name: new RegExp(searchKey) } : {}),
      ...(type && (Array.isArray(type) ? { type: { $in: type } } : { type })),
      ...parseParentIdInMongo(parentId)
    },
    '_id parentId avatar type name intro tmbId updateTime pluginData inheritPermission'
  )
    .sort({
      updateTime: -1
    })
    .lean();
  console.log('myApps>>>', myApps);
  // Add app permission and filter apps by read permission
  const formatApps = myApps
    .map((app) => {
      const { Per, privateApp } = (() => {
        const getPer = (appId: string) => {
          const tmbPer = myPerList.find(
            (item) => String(item.resourceId) === appId && !!item.tmbId
          )?.permission;
          const groupPer = concatPer(
            myPerList
              .filter(
                (item) => String(item.resourceId) === appId && (!!item.groupId || !!item.orgId)
              )
              .map((item) => item.permission)
          );

          return new AppPermission({
            per: tmbPer ?? groupPer ?? AppDefaultPermissionVal,
            isOwner: String(app.tmbId) === String(tmbId)
          });
        };

        const getClbCount = (appId: string) => {
          return perList.filter((item) => String(item.resourceId) === String(appId)).length;
        };

        // Inherit app, check parent folder clb
        if (!AppFolderTypeList.includes(app.type) && app.parentId && app.inheritPermission) {
          return {
            Per: getPer(String(app.parentId)),
            privateApp: getClbCount(String(app.parentId)) <= 1
          };
        }

        return {
          Per: getPer(String(app._id)),
          privateApp: AppFolderTypeList.includes(app.type)
            ? getClbCount(String(app._id)) <= 1
            : getClbCount(String(app._id)) === 0
        };
      })();

      return {
        ...app,
        permission: Per,
        private: privateApp
      };
    })
    .filter((app) => app.permission.hasReadPer);
  console.log('formatApps>>>', formatApps);
  return addSourceMember({
    list: formatApps
  });
}

export default NextAPI(handler);
