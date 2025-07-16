import React, { useMemo, useRef, useState } from 'react';
import {
  postChangeOwner,
  resumeInheritPer,
  getDatasetById,
  getDatasetCollectionById
} from '@/web/core/dataset/api';
import { Box, Flex, Grid, HStack } from '@chakra-ui/react';
import { DatasetTypeEnum, DatasetTypeMap } from '@fastgpt/global/core/dataset/constants';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRouter } from 'next/router';
import PermissionIconText from '@/components/support/permission/IconText';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { useRequest, useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { type DatasetItemType } from '@fastgpt/global/core/dataset/type';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { checkTeamExportDatasetLimit } from '@/web/support/user/team/api';
import { downloadFetch } from '@/web/common/system/utils';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import dynamic from 'next/dynamic';
import { useContextSelector } from 'use-context-selector';
import { DatasetsContext } from '../../../pages/dataset/list/context';
import { DatasetPermissionList } from '@fastgpt/global/support/permission/dataset/constant';
import ConfigPerModal from '@/components/support/permission/ConfigPerModal';
import {
  deleteDatasetCollaborators,
  getCollaboratorList,
  postUpdateDatasetCollaborators
} from '@/web/core/dataset/api/collaborator';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';
import { useFolderDrag } from '@/components/common/folder/useFolderDrag';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useTranslation } from 'next-i18next';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import SideTag from './SideTag';
import { getModelProvider } from '@fastgpt/global/core/ai/provider';
import UserBox from '@fastgpt/web/components/common/UserBox';
import user from '@fastgpt/global/common/error/code/user';
import axios from 'axios';
import { useUserStore } from '@/web/support/user/useUserStore';

const EditResourceModal = dynamic(() => import('@/components/common/Modal/EditResourceModal'));

function List() {
  const { userInfo } = useUserStore();
  const { setLoading } = useSystemStore();
  const { isPc } = useSystem();
  const { t } = useTranslation();
  const {
    loadMyDatasets,
    setMoveDatasetId,
    refetchPaths,
    editedDataset,
    setEditedDataset,
    onDelDataset,
    onUpdateDataset,
    myDatasets,
    folderDetail,
    setSearchKey
  } = useContextSelector(DatasetsContext, (v) => v);
  const [editPerDatasetId, setEditPerDatasetId] = useState<string>();
  const router = useRouter();
  const { parentId = null } = router.query as { parentId?: string | null };
  const parentDataset = useMemo(
    () => myDatasets.find((item) => String(item._id) === parentId),
    [parentId, myDatasets]
  );

  const { openConfirm: openMoveConfirm, ConfirmModal: MoveConfirmModal } = useConfirm({
    type: 'common',
    title: t('common:move.confirm'),
    content: t('dataset:move.hint')
  });

  const { runAsync: updateDataset } = useRequest2(onUpdateDataset);

  const { getBoxProps } = useFolderDrag({
    activeStyles: {
      borderColor: 'primary.600'
    },
    onDrop: (dragId: string, targetId: string) => {
      openMoveConfirm(() =>
        updateDataset({
          id: dragId,
          parentId: targetId
        })
      )();
    }
  });

  const refreshFileFilePermission = async (user: string, datasetId: string) => {
    axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
      datasetId,
      members: [user],
      permission: '0'
    });
    axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
      datasetId,
      members: [userInfo?.team?.tmbId],
      permission: '2'
    });
  };

  // const refreshParentFilePermission = async (id: string) => {
  //   return axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //     datasetId: id
  //   });
  //   // const resp = await getDatasetById(id);
  //   // if (resp.parentId) {
  //   //   const cResp = await getCollaboratorList(id);
  //   //   const pResp = await getCollaboratorList(resp.parentId);
  //   //   cResp.forEach((item: any) => {
  //   //     if (item.tmbId) {
  //   //       const curP = pResp.find((subItem: any) => subItem.tmbId === item.tmbId);
  //   //       if (curP) {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           members: [item.tmbId],
  //   //           permission: curP.permission.value === 4 ? '1' : '0'
  //   //         });
  //   //       } else {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           members: [item.tmbId],
  //   //           permission: '2'
  //   //         });
  //   //       }
  //   //     }
  //   //     if (item.groupId) {
  //   //       const curP = pResp.find((subItem: any) => subItem.groupId === item.groupId);
  //   //       if (curP) {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           groups: [item.groupId],
  //   //           permission: curP.permission.value === 4 ? '1' : '0'
  //   //         });
  //   //       } else {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           groups: [item.groupId],
  //   //           permission: '2'
  //   //         });
  //   //       }
  //   //     }
  //   //     if (item.orgId) {
  //   //       const curP = pResp.find((subItem: any) => subItem.orgId === item.orgId);
  //   //       if (curP) {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           orgs: [item.orgId],
  //   //           permission: curP.permission.value === 4 ? '1' : '0'
  //   //         });
  //   //       } else {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           orgs: [item.orgId],
  //   //           permission: '2'
  //   //         });
  //   //       }
  //   //     }
  //   //   });
  //   //   pResp.forEach((item: any) => {
  //   //     if (item.tmbId) {
  //   //       const curC = cResp.find((subItem: any) => subItem.tmbId === item.tmbId);
  //   //       if (!curC) {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           members: [item.tmbId],
  //   //           permission: item.permission.value === 4 ? '1' : '0'
  //   //         });
  //   //       }
  //   //     }
  //   //     if (item.groupId) {
  //   //       const curC = cResp.find((subItem: any) => subItem.groupId === item.groupId);
  //   //       if (!curC) {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           groups: [item.groupId],
  //   //           permission: item.permission.value === 4 ? '1' : '0'
  //   //         });
  //   //       }
  //   //     }
  //   //     if (item.orgId) {
  //   //       const curC = cResp.find((subItem: any) => subItem.orgId === item.orgId);
  //   //       if (!curC) {
  //   //         axios.post(`${window.myConfig.docServerUrl}/shtl/api/online/filePermission`, {
  //   //           datasetId: id,
  //   //           orgs: [item.orgId],
  //   //           permission: item.permission.value === 4 ? '1' : '0'
  //   //         });
  //   //       }
  //   //     }
  //   //   });
  //   // }
  // };

  const editPerDataset = useMemo(
    () => myDatasets.find((item) => String(item._id) === String(editPerDatasetId)),
    [editPerDatasetId, myDatasets]
  );

  const { mutate: exportDataset } = useRequest({
    mutationFn: async (dataset: DatasetItemType) => {
      setLoading(true);
      await checkTeamExportDatasetLimit(dataset._id);

      await downloadFetch({
        url: `/api/core/dataset/exportAll?datasetId=${dataset._id}`,
        filename: `${dataset.name}.csv`
      });
    },
    onSettled() {
      setLoading(false);
    },
    successToast: t('common:core.dataset.Start export'),
    errorToast: t('common:dataset.Export Dataset Limit Error')
  });

  const DeleteTipsMap = useRef({
    [DatasetTypeEnum.folder]: t('common:dataset.deleteFolderTips'),
    [DatasetTypeEnum.dataset]: t('common:core.dataset.Delete Confirm'),
    [DatasetTypeEnum.websiteDataset]: t('common:core.dataset.Delete Confirm'),
    [DatasetTypeEnum.externalFile]: t('common:core.dataset.Delete Confirm')
  });

  const formatDatasets = useMemo(
    () =>
      myDatasets.map((item) => {
        return {
          ...item,
          label: DatasetTypeMap[item.type]?.label,
          icon: DatasetTypeMap[item.type]?.icon
        };
      }),
    [myDatasets]
  );

  const { openConfirm, ConfirmModal } = useConfirm({
    type: 'delete'
  });

  const onClickDeleteDataset = (id: string) => {
    openConfirm(
      () =>
        onDelDataset(id).then(() => {
          refetchPaths();
          loadMyDatasets();
        }),
      undefined,
      DeleteTipsMap.current[DatasetTypeEnum.dataset]
    )();
  };

  return (
    <>
      {formatDatasets.length > 0 && (
        <Grid
          py={4}
          gridTemplateColumns={
            folderDetail
              ? ['1fr', 'repeat(2,1fr)', 'repeat(2,1fr)', 'repeat(3,1fr)']
              : ['1fr', 'repeat(2,1fr)', 'repeat(3,1fr)', 'repeat(3,1fr)', 'repeat(4,1fr)']
          }
          gridGap={5}
          alignItems={'stretch'}
        >
          {formatDatasets.map((dataset, index) => {
            const vectorModelAvatar = getModelProvider(dataset.vectorModel.provider)?.avatar;

            return (
              <MyTooltip
                key={dataset._id}
                label={
                  <Flex flexDirection={'column'} alignItems={'center'}>
                    <Box fontSize={'xs'} color={'myGray.500'}>
                      {dataset.type === DatasetTypeEnum.folder
                        ? t('common:open_folder')
                        : t('common:folder.open_dataset')}
                    </Box>
                  </Flex>
                }
              >
                <MyBox
                  display={'flex'}
                  flexDirection={'column'}
                  lineHeight={1.5}
                  h="100%"
                  pt={5}
                  pb={3}
                  px={5}
                  cursor={'pointer'}
                  borderWidth={1.5}
                  border={'base'}
                  boxShadow={'2'}
                  bg={'white'}
                  borderRadius={'lg'}
                  position={'relative'}
                  minH={'150px'}
                  {...getBoxProps({
                    dataId: dataset._id,
                    isFolder: dataset.type === DatasetTypeEnum.folder
                  })}
                  _hover={{
                    borderColor: 'primary.300',
                    boxShadow: '1.5',
                    '& .delete': {
                      display: 'block'
                    },
                    '& .more': {
                      display: 'flex'
                    },
                    '& .time': {
                      display: ['flex', 'none']
                    }
                  }}
                  onClick={() => {
                    if (dataset.type === DatasetTypeEnum.folder) {
                      setSearchKey('');
                      router.push({
                        pathname: '/dataset/list',
                        query: {
                          parentId: dataset._id
                        }
                      });
                    } else {
                      router.push({
                        pathname: '/dataset/detail',
                        query: {
                          datasetId: dataset._id
                        }
                      });
                    }
                  }}
                >
                  <HStack>
                    <Avatar src={dataset.avatar} borderRadius={6} w={'28px'} />
                    <Box flex={'1 0 0'} className="textEllipsis3" color={'myGray.900'}>
                      {dataset.name}
                    </Box>

                    <Box mr={'-1.25rem'}>
                      {dataset.type !== DatasetTypeEnum.folder && (
                        <SideTag
                          type={dataset.type}
                          py={0.5}
                          px={2}
                          borderLeftRadius={'sm'}
                          borderRightRadius={0}
                        />
                      )}
                    </Box>
                  </HStack>

                  <Box
                    flex={1}
                    className={'textEllipsis3'}
                    whiteSpace={'pre-wrap'}
                    py={3}
                    fontSize={'xs'}
                    color={'myGray.500'}
                  >
                    {dataset.intro ||
                      (dataset.type === DatasetTypeEnum.folder
                        ? t('common:core.dataset.Folder placeholder')
                        : t('common:core.dataset.Intro Placeholder'))}
                  </Box>

                  <Flex
                    h={'24px'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    fontSize={'sm'}
                    fontWeight={500}
                    color={'myGray.500'}
                  >
                    <HStack spacing={3.5}>
                      <UserBox
                        sourceMember={dataset.sourceMember}
                        fontSize="xs"
                        avatarSize="1rem"
                        spacing={0.5}
                      />
                      <PermissionIconText
                        flexShrink={0}
                        private={dataset.private}
                        iconColor="myGray.400"
                        color={'myGray.500'}
                      />
                    </HStack>

                    <HStack>
                      {isPc && dataset.type !== DatasetTypeEnum.folder && (
                        <HStack spacing={1} className="time">
                          <Avatar src={vectorModelAvatar} w={'0.85rem'} />
                          <Box color={'myGray.500'} fontSize={'mini'}>
                            {dataset.vectorModel.name}
                          </Box>
                        </HStack>
                      )}
                      {(dataset.type === DatasetTypeEnum.folder
                        ? dataset.permission.hasManagePer
                        : dataset.permission.hasWritePer) && (
                        <Box
                          className="more"
                          display={['', 'none']}
                          borderRadius={'md'}
                          _hover={{
                            '& .icon': {
                              bg: 'myGray.100'
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <MyMenu
                            Button={
                              <Box w={'22px'} h={'22px'}>
                                <MyIcon
                                  className="icon"
                                  name={'more'}
                                  h={'16px'}
                                  w={'16px'}
                                  px={1}
                                  py={1}
                                  borderRadius={'md'}
                                  cursor={'pointer'}
                                />
                              </Box>
                            }
                            menuList={[
                              {
                                children: [
                                  {
                                    icon: 'edit',
                                    label: t('common:dataset.Edit Info'),
                                    onClick: () =>
                                      setEditedDataset({
                                        id: dataset._id,
                                        name: dataset.name,
                                        intro: dataset.intro,
                                        avatar: dataset.avatar
                                      })
                                  },
                                  ...((parentDataset ? parentDataset : dataset)?.permission
                                    .hasManagePer
                                    ? [
                                        {
                                          icon: 'common/file/move',
                                          label: t('common:Move'),
                                          onClick: () => {
                                            setMoveDatasetId(dataset._id);
                                          }
                                        }
                                      ]
                                    : []),
                                  ...(dataset.permission.hasManagePer
                                    ? [
                                        {
                                          icon: 'key',
                                          label: t('common:permission.Permission'),
                                          onClick: () => setEditPerDatasetId(dataset._id)
                                        }
                                      ]
                                    : [])
                                ]
                              },
                              ...(dataset.type != DatasetTypeEnum.folder
                                ? [
                                    {
                                      children: [
                                        {
                                          icon: 'export',
                                          label: t('common:Export'),
                                          onClick: () => {
                                            exportDataset(dataset);
                                          }
                                        }
                                      ]
                                    }
                                  ]
                                : []),
                              ...(dataset.permission.hasManagePer
                                ? [
                                    {
                                      children: [
                                        {
                                          icon: 'delete',
                                          label: t('common:Delete'),
                                          type: 'danger' as 'danger',
                                          onClick: () => onClickDeleteDataset(dataset._id)
                                        }
                                      ]
                                    }
                                  ]
                                : [])
                            ]}
                          />
                        </Box>
                      )}
                    </HStack>
                  </Flex>
                </MyBox>
              </MyTooltip>
            );
          })}
        </Grid>
      )}
      {myDatasets.length === 0 && (
        <EmptyTip
          pt={'35vh'}
          text={t('common:core.dataset.Empty Dataset Tips')}
          flexGrow="1"
        ></EmptyTip>
      )}

      {editedDataset && (
        <EditResourceModal
          {...editedDataset}
          title={t('common:dataset.Edit Info')}
          onClose={() => setEditedDataset(undefined)}
          onEdit={async (data) => {
            await onUpdateDataset({
              id: editedDataset.id,
              name: data.name,
              intro: data.intro,
              avatar: data.avatar
            });
          }}
        />
      )}

      {!!editPerDataset && (
        <ConfigPerModal
          onChangeOwner={(tmbId: string) =>
            postChangeOwner({
              datasetId: editPerDataset._id,
              ownerId: tmbId
            }).then(() => {
              loadMyDatasets();
              // 转移所有权结束后
              refreshFileFilePermission(tmbId, editPerDataset._id);
            })
          }
          hasParent={!!parentId}
          refetchResource={loadMyDatasets}
          isInheritPermission={editPerDataset.inheritPermission}
          resumeInheritPermission={async () => {
            const resp = await axios.post(
              `${window.myConfig.docServerUrl}/shtl/api/online/filePermission`,
              {
                datasetId: editPerDataset._id
              }
            );
            if (resp.data.code === 0) {
              resumeInheritPer(editPerDataset._id).then(() => {
                Promise.all([loadMyDatasets()]);
              });
            }
          }}
          avatar={editPerDataset.avatar}
          name={editPerDataset.name}
          managePer={{
            permission: editPerDataset.permission,
            onGetCollaboratorList: () => getCollaboratorList(editPerDataset._id),
            permissionList: DatasetPermissionList,
            curDatasetId: editPerDataset._id,
            onUpdateCollaborators: (props) =>
              postUpdateDatasetCollaborators({
                ...props,
                datasetId: editPerDataset._id
              }),
            onDelOneCollaborator: async (props) =>
              deleteDatasetCollaborators({
                ...props,
                datasetId: editPerDataset._id
              }),
            refreshDeps: [editPerDataset._id, editPerDataset.inheritPermission]
          }}
          onClose={() => setEditPerDatasetId(undefined)}
        />
      )}
      <ConfirmModal />
      <MoveConfirmModal />
    </>
  );
}

export default List;
