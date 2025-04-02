import 
  React, { 
    useEffect, 
    useState, 
    useCallback, 
    useRef 
  } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Table, 
  Pagination, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Popover 
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { 
  userLoginList, 
  UserLoginListRequest, 
  Login 
} from '@/api/user';
import UserCard from '@/components/widgets/UserCard/UserCard';
import './login-logs.css';

const LoginLogs: React.FC = () => {
  const [userLoginTableData, setUserLoginTableData] = useState<Login[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [userLoginListRequest, setUserLoginListRequest] = useState<UserLoginListRequest>({
    uuid: null,
    page: 1,
    page_size: 10,
  });

  const location = useLocation();
  const navigate = useNavigate();

  // 使用 useRef 缓存 userLoginListRequest
  const userLoginListRequestRef = useRef(userLoginListRequest);
  userLoginListRequestRef.current = userLoginListRequest;

  // 使用 useCallback 确保 getUserLoginTableData 的稳定性
  const getUserLoginTableData = useCallback(async (params: UserLoginListRequest) => {
    try {
      const table = await userLoginList(params);
      if (table.code === 0) {
        setUserLoginTableData(table.data.list);
        setTotal(table.data.total);

        navigate({
          pathname: location.pathname,
          search: `?uuid=${params.uuid ?? ''}&page=${params.page}&page_size=${params.page_size}`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch login logs:', error);
    }
  }, [navigate, location.pathname]);

  // 只在 location.search 变化时触发
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const uuid = query.get('uuid') || '';
    const page = Number(query.get('page')) || 1;
    const pageSize = Number(query.get('page_size')) || 10;

    // 如果 URL 查询参数和当前请求参数不一致，则更新状态
    if (
      uuid !== userLoginListRequestRef.current.uuid ||
      page !== userLoginListRequestRef.current.page ||
      pageSize !== userLoginListRequestRef.current.page_size
    ) {
      const newRequest = { uuid: uuid || null, page, page_size: pageSize };
      setUserLoginListRequest(newRequest);
      getUserLoginTableData(newRequest);
    }
  }, [location.search, getUserLoginTableData]);

  const handleSearch = () => {
    const params: UserLoginListRequest = {
      ...userLoginListRequest,
      page: 1,
      uuid: userLoginListRequest.uuid?.trim() || null,
    };

    setUserLoginListRequest(params);
    getUserLoginTableData(params);
  };

  const handlePageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    setPageSize(newPageSize || pageSize);

    getUserLoginTableData({
      ...userLoginListRequest,
      page: newPage,
      page_size: newPageSize || pageSize,
    });
  };

  const getTime = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  const columns = [
    {
      title: '用户',
      width: 80,
      render: (record: Login) => (
        <Popover
          content={
            <UserCard
              uuid={record.user.uuid}
              userCardInfo={record.user}
              onUserCardInfoChange={() => { }}
            />
          }
          trigger="hover"
        >
          <Avatar src={record.user.avatar} />
        </Popover>
      ),
    },
    {
      title: '用户名',
      width: 80,
      render: (record: Login) => record.user.username,
    },
    {
      title: '登录时间',
      render: (record: Login) => getTime(record.created_at),
    },
    {
      title: '登录方式',
      dataIndex: 'login_method',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
    },
    {
      title: '登录地址',
      dataIndex: 'address',
    },
    {
      title: '操作系统',
      dataIndex: 'os',
    },
    {
      title: '设备信息',
      dataIndex: 'device_info',
    },
    {
      title: '浏览器信息',
      dataIndex: 'browser_info',
    },
    {
      title: '登录状态',
      dataIndex: 'status',
    },
  ];

  return (
    <div className="login-logs">
      <div className="title">
        <h2>登录日志</h2>
      </div>

      <div className="user-login-list-request">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item label="UUID">
            <Input
              value={userLoginListRequest.uuid || ''}
              onChange={(e) =>
                setUserLoginListRequest({
                  ...userLoginListRequest,
                  uuid: e.target.value.trim() || null,
                })
              }
              placeholder="请输入用户 UUID"
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Table
        columns={columns}
        dataSource={userLoginTableData}
        rowKey="id"
        pagination={false}
      />

      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        pageSizeOptions={[10, 30, 50, 100]}
        onChange={handlePageChange}
        onShowSizeChange={handlePageChange}
        showSizeChanger
        showQuickJumper
        className="pagination"
      />
    </div>
  );
};

export default LoginLogs;