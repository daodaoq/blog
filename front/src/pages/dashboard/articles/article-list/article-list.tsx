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
  Tag,
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
  Article, 
  ArticleDeleteRequest, 
  articleDelete, 
  articleList 
} from '@/api/article';
import useLayoutStore from '@/stores/layout';
import useTagStore from '@/stores/tag';
import type { Hit } from '@/api/common';
import ArticleUpdateForm from '@/components/common/forms/ArticleUpdateForm/ArticleUpdateForm';
import './article-list.css';

const ArticleList: React.FC = () => {
  const [articleTableData, setArticleTableData] = useState<Hit<Article>[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [articleBulkDeleteVisible, setArticleBulkDeleteVisible] = useState(false);
  const [articleDeleteVisible, setArticleDeleteVisible] = useState(false);
  const [articleUpdateVisible, setArticleUpdateVisible] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [articleInfo, setArticleInfo] = useState<Hit<Article> | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const location = useLocation();
  const navigate = useNavigate();
  const layoutStore = useLayoutStore();
  const tagStore = useTagStore();

  // Memoize articleListRequest to prevent unnecessary re-renders
  const articleListRequest = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      title: query.get('title') || null,
      category: query.get('category') || null,
      abstract: query.get('abstract') || null,
      page: Number(query.get('page')) || 1,
      page_size: Number(query.get('page_size')) || 10,
    };
  }, [location.search]);

  // Fetch article data
  const getArticleTableData = useCallback(async () => {
    const res = await articleList(articleListRequest);
    if (res.code === 0) {
      console.log('Fetched data:', res.data.list); // 打印数据
      setArticleTableData(res.data.list);
      setTotal(res.data.total);
    }
  }, [articleListRequest]);

  // Fetch data on component mount or when articleListRequest changes
  useEffect(() => {
    getArticleTableData();
  }, [getArticleTableData]);

  const handleToPublishArticle = () => {
    const newTag = { title: '发布文章', name: 'article-publish' };
    if (!tagStore.tags.some((tag) => tag.name === newTag.name)) {
      tagStore.addTag(newTag);
    }
    navigate('/article-publish');
  };

  const handleIdsToDelete = () => {
    setIdsToDelete(selectedRowKeys.map(String));
  };

  const handleBulkDelete = async () => {
    const requestData: ArticleDeleteRequest = {
      ids: idsToDelete,
    };
    const res = await articleDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setArticleBulkDeleteVisible(false);
      layoutStore.setState({ shouldRefreshArticleTable: true });
      getArticleTableData(); // Refresh table data after deletion
    }
  };

  const handleDelete = async (id: string) => {
    const requestData: ArticleDeleteRequest = {
      ids: [id],
    };
    const res = await articleDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setArticleDeleteVisible(false);
      layoutStore.setState({ shouldRefreshArticleTable: true });
      getArticleTableData(); // Refresh table data after deletion
    }
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setPage(1); // Reset to first page when searching
    setPageSize(10); // Reset page size
    navigate({
      pathname: location.pathname,
      search: `?title=${values.title || ''}&category=${values.category || ''}&abstract=${values.abstract || ''}&page=1&page_size=10`,
    });
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    navigate({
      pathname: location.pathname,
      search: `?title=${articleListRequest.title || ''}&category=${articleListRequest.category || ''}&abstract=${articleListRequest.abstract || ''}&page=${newPage}&page_size=${newPageSize}`,
    });
  };

  const columns: ColumnsType<Hit<Article>> = [
    {
      title: '封面',
      dataIndex: ['_source', 'cover'], // 修正为 _source.cover
      key: 'cover',
      width: 100,
      render: (text: string) => <Image src={text} alt="封面" width={48} />,
    },
    {
      title: '标题',
      dataIndex: ['_source', 'title'], // 修正为 _source.title
      key: 'title',
      width: 120,
    },
    {
      title: '类别',
      dataIndex: ['_source', 'category'], // 修正为 _source.category
      key: 'category',
      width: 80,
    },
    {
      title: '标签',
      dataIndex: ['_source', 'tags'], // 修正为 _source.tags
      key: 'tags',
      width: 120,
      render: (tags: string[] | undefined) => (
        <>
          {(tags || []).map((tag, index) => (
            <Tag key={`${tag}-${index}`}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '简介',
      dataIndex: ['_source', 'abstract'], // 修正为 _source.abstract
      key: 'abstract',
      render: (text: string) => <div style={{ maxHeight: '100px', overflow: 'hidden' }}>{text}</div>,
    },
    {
      title: '发布时间',
      dataIndex: ['_source', 'created_at'], // 修正为 _source.created_at
      key: 'created_at',
      width: 102,
    },
    {
      title: '文章ID',
      dataIndex: '_id', // 直接使用 _id
      key: 'id',
      width: 220,
      render: (text: string) => <a href={`/article/${text}`}>{text}</a>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <>
          <Button
            type="link"
            onClick={() => {
              setArticleUpdateVisible(true);
              setArticleInfo(record);
            }}
          >
            更新
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              setArticleDeleteVisible(true);
              setArticleInfo(record);
            }}
          >
            删除
          </Button>
        </>
      ),
    },
  ];
  
  return (
    <div className="article-list">
      <div className="title">
        <h2>文章列表</h2>
        <div className="button-group">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleToPublishArticle}>
            新建文章
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setArticleBulkDeleteVisible(true);
              handleIdsToDelete();
            }}
          >
            批量删除
          </Button>
        </div>
      </div>

      <Modal
        title="删除文章"
        open={articleBulkDeleteVisible}
        onOk={handleBulkDelete}
        onCancel={() => setArticleBulkDeleteVisible(false)}
      >
        您已选中 [{idsToDelete.length}] 项资源，删除后将无法恢复，是否确认删除？
      </Modal>

      <div className="article-list-request">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item label="文章标题" name="title">
            <Input placeholder="请输入文章标题" />
          </Form.Item>
          <Form.Item label="文章类别" name="category">
            <Input placeholder="请输入文章类别" />
          </Form.Item>
          <Form.Item label="文章简介" name="abstract">
            <Input placeholder="请输入文章简介" />
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
        dataSource={articleTableData}
        rowKey="_id"
        pagination={false}
      />

      <Modal
        title="更新文章"
        open={articleUpdateVisible}
        onCancel={() => setArticleUpdateVisible(false)}
        footer={null}
      >
        {articleInfo && <ArticleUpdateForm article={articleInfo} />}
      </Modal>

      <Modal
        title="删除文章"
        open={articleDeleteVisible}
        onOk={() => handleDelete(articleInfo?._id ?? '')}
        onCancel={() => setArticleDeleteVisible(false)}
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

export default ArticleList;