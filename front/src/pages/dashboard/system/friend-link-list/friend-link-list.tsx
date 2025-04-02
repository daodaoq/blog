import 
  React, { 
    useEffect, 
    useState, 
    useCallback, 
    useMemo 
  } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  Pagination,
  Image,
  message,
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  FriendLink,
  FriendLinkDeleteRequest,
  friendLinkDelete,
  friendLinkList,
} from '@/api/friend-link';
import useLayoutStore from '@/stores/layout';
import FriendLinkCreateForm from '@/components/common/forms/FriendLinkCreateForm/FriendLinkCreateForm';
import FriendLinkUpdateForm from '@/components/common/forms/FriendLinkUpdateForm/FriendLinkUpdateForm';
import './friend-link-list.css';

const FriendLinkList: React.FC = () => {
  const [friendLinkTableData, setFriendLinkTableData] = useState<FriendLink[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [friendLinkCreateVisible, setFriendLinkCreateVisible] = useState(false);
  const [friendLinkBulkDeleteVisible, setFriendLinkBulkDeleteVisible] = useState(false);
  const [friendLinkDeleteVisible, setFriendLinkDeleteVisible] = useState(false);
  const [friendLinkUpdateVisible, setFriendLinkUpdateVisible] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [friendLinkInfo, setFriendLinkInfo] = useState<FriendLink | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const layoutStore = useLayoutStore();

  const friendLinkListRequest = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      name: query.get('name') || null,
      description: query.get('description') || null,
      page: Number(query.get('page')) || 1,
      page_size: Number(query.get('page_size')) || 10,
    };
  }, [location.search]);

  const getFriendLinkTableData = useCallback(async () => {
    const res = await friendLinkList(friendLinkListRequest);
    if (res.code === 0) {
      setFriendLinkTableData(res.data.list);
      setTotal(res.data.total);
    }
  }, [friendLinkListRequest]);

  useEffect(() => {
    getFriendLinkTableData();
  }, [getFriendLinkTableData]);

  const handleIdsToDelete = () => {
    setIdsToDelete(selectedRowKeys.map(Number));
  };

  const handleBulkDelete = async () => {
    const requestData: FriendLinkDeleteRequest = {
      ids: idsToDelete,
    };
    const res = await friendLinkDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setFriendLinkBulkDeleteVisible(false);
      layoutStore.setState({ shouldRefreshFriendLinkTable: true });
      getFriendLinkTableData();
    }
  };

  const handleDelete = async (id: number) => {
    const requestData: FriendLinkDeleteRequest = {
      ids: [id],
    };
    const res = await friendLinkDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setFriendLinkDeleteVisible(false);
      layoutStore.setState({ shouldRefreshFriendLinkTable: true });
      getFriendLinkTableData();
    }
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setPage(1);
    setPageSize(10);
    navigate({
      pathname: location.pathname,
      search: `?name=${values.name || ''}&description=${values.description || ''}&page=1&page_size=10`,
    });
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    navigate({
      pathname: location.pathname,
      search: `?name=${friendLinkListRequest.name || ''}&description=${friendLinkListRequest.description || ''}&page=${newPage}&page_size=${newPageSize}`,
    });
  };

  const columns: ColumnsType<FriendLink> = [
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      render: (text: string) => <Image src={text} alt="logo" width={48} />,
    },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button
            type="link"
            onClick={() => {
              setFriendLinkUpdateVisible(true);
              setFriendLinkInfo(record);
            }}
          >
            更新
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              setFriendLinkDeleteVisible(true);
              setFriendLinkInfo(record);
            }}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  const [form] = Form.useForm();

  return (
    <div className="friend-link-list">
      <div className="title">
        <h2>友链列表</h2>
        <div className="button-group">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFriendLinkCreateVisible(true)}
          >
            新建友链
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setFriendLinkBulkDeleteVisible(true);
              handleIdsToDelete();
            }}
          >
            批量删除
          </Button>
        </div>
      </div>

      <Modal
        title="新建友链"
        open={friendLinkCreateVisible}
        onCancel={() => setFriendLinkCreateVisible(false)}
        footer={null}
      >
        <FriendLinkCreateForm />
      </Modal>

      <Modal
        title="删除友链"
        open={friendLinkBulkDeleteVisible}
        onOk={handleBulkDelete}
        onCancel={() => setFriendLinkBulkDeleteVisible(false)}
      >
        您已选中 [{idsToDelete.length}] 项资源，删除后将无法恢复，是否确认删除？
      </Modal>

      <div className="friend-link-list-request">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item label="友链名称" name="name">
            <Input placeholder="请输入友链名称" />
          </Form.Item>
          <Form.Item label="友链描述" name="description">
            <Input placeholder="请输入友链描述" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
        }}
        columns={columns}
        dataSource={friendLinkTableData}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title="更新友链"
        open={friendLinkUpdateVisible}
        onCancel={() => setFriendLinkUpdateVisible(false)}
        footer={null}
      >
        {friendLinkInfo && <FriendLinkUpdateForm friendLink={friendLinkInfo} />}
      </Modal>

      <Modal
        title="删除友链"
        open={friendLinkDeleteVisible}
        onOk={() => handleDelete(friendLinkInfo?.id ?? 0)}
        onCancel={() => setFriendLinkDeleteVisible(false)}
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

export default FriendLinkList;