import 
  React, { 
    useEffect, 
    useState, 
    useCallback 
  } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  Modal,
  Pagination,
  Avatar,
  Popover,
  message,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  Feedback,
  FeedbackDeleteRequest,
  feedbackDelete,
  feedbackList
} from '@/api/feedback';
import useLayoutStore from '@/stores/layout';
import UserCard from '@/components/widgets/UserCard/UserCard';
import type { UserCardResponse } from '@/api/user';
import './feedback-list.css';

const FeedbackList: React.FC = () => {
  const [feedbackTableData, setFeedbackTableData] = useState<Feedback[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [feedbackBulkDeleteVisible, setFeedbackBulkDeleteVisible] = useState(false);
  const [feedbackDeleteVisible, setFeedbackDeleteVisible] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [feedbackInfo, setFeedbackInfo] = useState<Feedback | null>(null);

  // 新增：管理用户卡片信息的状态
  const [userCardInfoMap, setUserCardInfoMap] = useState<Record<string, UserCardResponse>>({});

  const handleUserCardInfoChange = (uuid: string, message: UserCardResponse) => {
    setUserCardInfoMap((prev) => ({
      ...prev,
      [uuid]: message,
    }));
  };

  const location = useLocation();
  const navigate = useNavigate();
  const layoutStore = useLayoutStore();

  const getFeedbackTableData = useCallback(async () => {
    const res = await feedbackList({ page, page_size: pageSize });
    if (res.code === 0) {
      setFeedbackTableData(res.data.list);
      setTotal(res.data.total);
    }
  }, [page, pageSize]);

  useEffect(() => {
    getFeedbackTableData();
  }, [getFeedbackTableData]);

  const handleIdsToDelete = () => {
    setIdsToDelete(selectedRowKeys.map(Number));
  };

  const handleBulkDelete = async () => {
    const requestData: FeedbackDeleteRequest = {
      ids: idsToDelete,
    };
    const res = await feedbackDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setFeedbackBulkDeleteVisible(false);
      layoutStore.setState({ shouldRefreshFeedbackTable: true });
      getFeedbackTableData();
    }
  };

  const handleDelete = async (id: number) => {
    const requestData: FeedbackDeleteRequest = {
      ids: [id],
    };
    const res = await feedbackDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setFeedbackDeleteVisible(false);
      layoutStore.setState({ shouldRefreshFeedbackTable: true });
      getFeedbackTableData();
    }
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    navigate({
      pathname: location.pathname,
      search: `?page=${newPage}&page_size=${newPageSize}`,
    });
  };

  const getTime = (date: Date): string => {
    const time = new Date(date);
    return time.toLocaleString();
  };

  const columns: ColumnsType<Feedback> = [
    {
      title: '用户',
      dataIndex: 'user_uuid',
      key: 'user_uuid',
      width: 80,
      render: (uuid: string) => {
        const userCardInfo = userCardInfoMap[uuid] || null;
        return (
          <Popover
            content={
              <UserCard
                uuid={uuid}
                userCardInfo={userCardInfo}
                onUserCardInfoChange={(message) => handleUserCardInfoChange(uuid, message)}
              />
            }
            trigger="hover"
          >
            <Avatar src={userCardInfo?.avatar || ''} />
          </Popover>
        );
      },
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: Date) => getTime(date),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: '回复',
      dataIndex: 'reply',
      key: 'reply',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <>
          <Button
            type="link"
            danger
            onClick={() => {
              setFeedbackDeleteVisible(true);
              setFeedbackInfo(record);
            }}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="feedback-list">
      <div className="title">
        <h2>反馈列表</h2>
        <div className="button-group">
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setFeedbackBulkDeleteVisible(true);
              handleIdsToDelete();
            }}
          >
            批量删除
          </Button>
        </div>
      </div>

      <Modal
        title="删除反馈"
        open={feedbackBulkDeleteVisible}
        onOk={handleBulkDelete}
        onCancel={() => setFeedbackBulkDeleteVisible(false)}
      >
        您已选中 [{idsToDelete.length}] 项资源，删除后将无法恢复，是否确认删除？
      </Modal>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
        }}
        columns={columns}
        dataSource={feedbackTableData}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title="删除反馈"
        open={feedbackDeleteVisible}
        onOk={() => handleDelete(feedbackInfo?.id ?? 0)}
        onCancel={() => setFeedbackDeleteVisible(false)}
      >
        您已选中 [1] 项资源，删除后将无法恢复，是否确认删除？
      </Modal>

      <Pagination
        className="pagination"
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
        showSizeChanger
        pageSizeOptions={[10, 30, 50, 100]}
      />
    </div>
  );
};

export default FeedbackList;