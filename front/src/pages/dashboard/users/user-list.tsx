import 
  React, { 
    useEffect, 
    useState, 
    useCallback 
  } from 'react';
import { 
  Table, 
  Pagination, 
  Input, 
  Select, 
  Button, 
  Avatar, 
  Modal, 
  message 
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons'; // 导入 SearchOutlined 图标
import { 
  userList, 
  userFreeze, 
  userUnfreeze, 
  type User, 
  type UserListRequest, 
  type UserOperation 
} from '@/api/user';
import useLayoutStore from '@/stores/layout';
import './user-list.css';

const { Option } = Select;

const UserList: React.FC = () => {
  const [userTableData, setUserTableData] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userFreezeVisible, setUserFreezeVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userListRequest, setUserListRequest] = useState<UserListRequest>({
    uuid: null,
    register: null,
    page: 1,
    page_size: 10,
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { shouldRefreshUserTable, setState } = useLayoutStore();

  // 注册来源选项
  const registerOptions = [
    { value: '', label: '全部' },
    { value: 'QQ', label: 'QQ' },
    { value: '邮箱', label: '邮箱' },
  ];

  // 格式化时间
  const getTime = (date: Date): string => {
    const time = new Date(date);
    return time.toLocaleString();
  };

  // 获取用户列表数据
  const getUserTableData = useCallback(async () => {
    const response = await userList(userListRequest);
    if (response.code === 0 && response.data) {
      setUserTableData(response.data.list);
      setTotal(response.data.total);
    }
  }, [userListRequest]);

  // 初始化加载数据
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setUserListRequest({
      uuid: searchParams.get('uuid') || null,
      register: searchParams.get('register') || null,
      page: Number(searchParams.get('page')) || 1,
      page_size: Number(searchParams.get('page_size')) || 10,
    });
  }, [location.search]);

  // 监听 userListRequest 变化
  useEffect(() => {
    getUserTableData();
  }, [getUserTableData]);

  // 监听 shouldRefreshUserTable 变化
  useEffect(() => {
    if (shouldRefreshUserTable) {
      getUserTableData();
      setState({ shouldRefreshUserTable: false });
    }
  }, [shouldRefreshUserTable, setState, getUserTableData]);

  // 处理分页变化
  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    setUserListRequest((prev) => ({ ...prev, page: newPage, page_size: newPageSize }));
    navigate({
      pathname: location.pathname,
      search: `?uuid=${userListRequest.uuid}&register=${userListRequest.register}&page=${newPage}&page_size=${newPageSize}`,
    });
  };

  // 处理查询
  const handleSearch = () => {
    setPage(1);
    setPageSize(10);
    setUserListRequest((prev) => ({ ...prev, page: 1, page_size: 10 }));
    navigate({
      pathname: location.pathname,
      search: `?uuid=${userListRequest.uuid}&register=${userListRequest.register}&page=1&page_size=10`,
    });
  };

  // 处理冻结/解冻操作
  const handleFreeze = async (id: number, freeze: boolean) => {
    const userOperationRequest: UserOperation = { id };
    const response = freeze ? await userFreeze(userOperationRequest) : await userUnfreeze(userOperationRequest);
    if (response.code === 0) {
      message.success(response.msg);
      setUserFreezeVisible(false);
      setState({ shouldRefreshUserTable: true });
    }
  };

  // 表格列配置
  const columns: ColumnsType<User> = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar: string) => <Avatar src={avatar} />,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'UUID',
      dataIndex: 'uuid',
      key: 'uuid',
      width: 320,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 250,
      render: (created_at: Date) => getTime(created_at),
    },
    {
      title: '角色',
      dataIndex: 'role_id',
      key: 'role_id',
      render: (role_id: number) => (role_id === 2 ? '管理员' : '普通用户'),
    },
    {
      title: '注册来源',
      dataIndex: 'register',
      key: 'register',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.role_id === 1 && (
          <Button
            type="primary" // 将 type 改为 "primary"
            danger={!record.freeze} // 使用 danger 属性表示警告状态
            onClick={() => {
              setSelectedUser(record);
              setUserFreezeVisible(true);
            }}
          >
            {record.freeze ? '解冻' : '冻结'}
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="user-list">
      <div className="title">用户列表</div>

      <div className="user-list-request">
        <Input
          placeholder="请输入用户UUID"
          value={userListRequest.uuid || ''}
          onChange={(e) => setUserListRequest((prev) => ({ ...prev, uuid: e.target.value || null }))}
          style={{ width: 200, marginRight: 16 }}
        />
        <Select
          placeholder="选择注册来源"
          value={userListRequest.register || ''}
          onChange={(value) => setUserListRequest((prev) => ({ ...prev, register: value || null }))}
          style={{ width: 200, marginRight: 16 }}
        >
          {registerOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          查询
        </Button>
      </div>

      <Table
        dataSource={userTableData}
        columns={columns}
        rowKey="id"
        bordered
        pagination={false}
      />

      <Pagination
        className="pagination"
        current={page}
        pageSize={pageSize}
        total={total}
        pageSizeOptions={[10, 30, 50, 100]}
        showSizeChanger
        showQuickJumper
        onChange={handlePageChange}
        onShowSizeChange={handlePageChange}
      />

      <Modal
        title={selectedUser?.freeze ? '解冻用户' : '冻结用户'}
        open={userFreezeVisible}
        onCancel={() => setUserFreezeVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setUserFreezeVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => {
              if (selectedUser) {
                handleFreeze(selectedUser.id, !selectedUser.freeze);
              }
            }}
          >
            确定
          </Button>,
        ]}
      >
        是否{selectedUser?.freeze ? '解冻' : '冻结'}该用户：{selectedUser?.username}？
      </Modal>
    </div>
  );
};

export default UserList;