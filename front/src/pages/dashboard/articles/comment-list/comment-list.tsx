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
  Form, 
  Input, 
  Pagination, 
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { 
  Comment, 
  CommentDeleteRequest, 
  CommentListRequest, 
  commentDelete, 
  commentList 
} from '@/api/comment';
import UserCardPopover from '@/components/common/UserCardPopover/UserCardPopover';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import useLayoutStore from '@/stores/layout';
import './comment-list.css';

const CommentList: React.FC = () => {
  const [commentTableData, setCommentTableData] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [commentBulkDeleteVisible, setCommentBulkDeleteVisible] = useState(false);
  const [commentDeleteVisible, setCommentDeleteVisible] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [commentInfo, setCommentInfo] = useState<Comment | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const location = useLocation();
  const navigate = useNavigate();
  const layoutStore = useLayoutStore();

  const [commentListRequest, setCommentListRequest] = useState<CommentListRequest>({
    article_id: null,
    user_uuid: null,
    content: null,
    page: 1,
    page_size: 10,
  });

  const getCommentTableData = useCallback(async () => {
    const res = await commentList(commentListRequest);
    if (res.code === 0) {
      setCommentTableData(res.data.list);
      setTotal(res.data.total);
    }
  }, [commentListRequest]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setCommentListRequest({
      article_id: query.get('article_id') || null,
      user_uuid: query.get('user_uuid') || null,
      content: query.get('content') || null,
      page: Number(query.get('page')) || 1,
      page_size: Number(query.get('page_size')) || 10,
    });
    getCommentTableData();
  }, [location.search, getCommentTableData]);

  const handleBulkDelete = async () => {
    const requestData: CommentDeleteRequest = {
      ids: idsToDelete,
    };
    const res = await commentDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setCommentBulkDeleteVisible(false);
      layoutStore.setState({ shouldRefreshCommentTable: true });
    }
  };

  const handleDelete = async (id: number) => {
    const requestData: CommentDeleteRequest = {
      ids: [id],
    };
    const res = await commentDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setCommentDeleteVisible(false);
      layoutStore.setState({ shouldRefreshCommentTable: true });
    }
  };

  const handleIdsToDelete = () => {
    setIdsToDelete(selectedRowKeys.map(Number));
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setCommentListRequest({
      ...commentListRequest,
      ...values,
      page: 1,
      page_size: pageSize,
    });
    navigate({
      pathname: location.pathname,
      search: `?article_id=${values.article_id || ''}&user_uuid=${values.user_uuid || ''}&content=${values.content || ''}&page=1&page_size=${pageSize}`,
    });
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    setCommentListRequest({
      ...commentListRequest,
      page: newPage,
      page_size: newPageSize,
    });
    navigate({
      pathname: location.pathname,
      search: `?article_id=${commentListRequest.article_id || ''}&user_uuid=${commentListRequest.user_uuid || ''}&content=${commentListRequest.content || ''}&page=${newPage}&page_size=${newPageSize}`,
    });
  };

  const columns: ColumnsType<Comment> = [
    {
      title: '文章id',
      dataIndex: 'article_id',
      key: 'article_id',
      width: 200,
      render: (text: string) => <a href={`/article/${text}`}>{text}</a>,
    },
    {
      title: '用户',
      dataIndex: 'user_uuid',
      key: 'user_uuid',
      width: 80,
      render: (text: string) => <UserCardPopover uuid={text} />,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => <MdEditor modelValue={text} preview />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          danger
          onClick={() => {
            setCommentDeleteVisible(true);
            setCommentInfo(record);
          }}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div className="comment-list">
      <div className="title">
        <h2>评论列表</h2>
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            setCommentBulkDeleteVisible(true);
            handleIdsToDelete();
          }}
        >
          批量删除
        </Button>
      </div>

      <Modal
        title="删除评论"
        open={commentBulkDeleteVisible}
        onOk={handleBulkDelete}
        onCancel={() => setCommentBulkDeleteVisible(false)}
      >
        您已选中 [{idsToDelete.length}] 项资源，删除后将无法恢复，是否确认删除？
      </Modal>

      <div className="comment-list-request">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item label="文章id" name="article_id">
            <Input placeholder="请输入文章id" />
          </Form.Item>
          <Form.Item label="用户uuid" name="user_uuid">
            <Input placeholder="请输入用户uuid" />
          </Form.Item>
          <Form.Item label="评论内容" name="content">
            <Input placeholder="请输入评论内容" />
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
        dataSource={commentTableData}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title="删除评论"
        open={commentDeleteVisible}
        onOk={() => handleDelete(commentInfo?.id ?? 0)}
        onCancel={() => setCommentDeleteVisible(false)}
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

export default CommentList;