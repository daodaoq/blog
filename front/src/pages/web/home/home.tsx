import 
  React, { 
    useState, 
    useEffect, 
    useMemo, 
    useCallback 
  } from 'react';
import {
  Card,
  Row,
  Input,
  Button,
  Radio,
  Table,
  Pagination,
  Image,
  Tag
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  MessageOutlined,
  StarOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import {
  type Article,
  articleCategory,
  articleSearch,
  type ArticleSearchRequest,
  articleTags
} from '@/api/article';
import { type Hit } from '@/api/common';
import './home.css';

const ArticleList: React.FC = () => {
  const [articleSearchRequest, setArticleSearchRequest] = useState<ArticleSearchRequest>({
    query: '',
    category: '',
    tag: '',
    sort: '',
    order: 'desc',
    page: 1,
    page_size: 10
  });

  const [categoryArr, setCategoryArr] = useState<string[]>([]);
  const [tagArr, setTagArr] = useState<string[]>([]);

  const sortArr = [
    { label: '默认', value: '' },
    { label: '时间', value: 'time' },
    { label: '评论', value: 'comment' },
    { label: '浏览', value: 'view' },
    { label: '点赞', value: 'like' }
  ];

  const downColor = useMemo(() => {
    return articleSearchRequest.order === 'desc' ? 'blue' : 'gray';
  }, [articleSearchRequest.order]);

  const upColor = useMemo(() => {
    return articleSearchRequest.order === 'desc' ? 'gray' : 'blue';
  }, [articleSearchRequest.order]);

  const handleSortClick = () => {
    setArticleSearchRequest(prev => ({
      ...prev,
      order: prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  useEffect(() => {
    const fetchArticleCategory = async () => {
      const res = await articleCategory();
      if (res.code === 0) {
        const categories = res.data.map(item => item.category);
        setCategoryArr(categories);
      }
    };
    fetchArticleCategory();
  }, []);

  useEffect(() => {
    const fetchArticleTags = async () => {
      const res = await articleTags();
      if (res.code === 0) {
        const tags = res.data.map(item => item.tag);
        setTagArr(tags);
      }
    };
    fetchArticleTags();
  }, []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [articleTableData, setArticleTableData] = useState<Hit<Article>[]>([]);

  const getArticleSearchTableData = useCallback(async () => {
    const newRequest = {
      ...articleSearchRequest,
      page,
      page_size: pageSize
    };
    const table = await articleSearch(newRequest);
    if (table.code === 0) {
      setArticleTableData(table.data.list);
      setTotal(table.data.total);
    }
  }, [articleSearchRequest, page, pageSize]);

  useEffect(() => {
    getArticleSearchTableData();
  }, [getArticleSearchTableData]);

  const changeArticleSearchItem = () => {
    getArticleSearchTableData();
  };

  const handleArticleJumps = (id: string) => {
    window.open(`/article/${id}`);
  };

  const handleSizeChange = (current: number, size: number) => {
    setPageSize(size); // 更新 pageSize
    setPage(current); // 更新当前页码
  };

  const handleCurrentChange = (val: number) => {
    setPage(val);
  };

  const columns = [
    {
      title: 'cover',
      dataIndex: '',
      width: 200,
      render: (record: Hit<Article>) =>
        record._source.cover ? (
          <Image style={{ width: 160, height: 100 }} src={record._source.cover} alt="cover" preview={false} />
        ) : (
          <span>无封面</span>
        )
    },
    {
      title: 'description',
      dataIndex: '',
      render: (record: Hit<Article>) => (
        <div className="description" onClick={() => handleArticleJumps(record._id)}>
          <Row className="title">{record._source.title}</Row>
          <div className="abstract">{record._source.abstract}</div>
          <div className="footer">
            <div className="tags">
              {record._source.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag> // 给每个Tag添加key
              ))}
            </div>
            <div className="status">
              发布时间：{record._source.created_at}
              <EyeOutlined /> {record._source.views}
              <MessageOutlined /> {record._source.comments}
              <StarOutlined /> {record._source.likes}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Card className="article-list">
      <Row className="title">文章列表</Row>
      <div className="search">
        <Input
          value={articleSearchRequest.query}
          onChange={(e) =>
            setArticleSearchRequest(prev => ({
              ...prev,
              query: e.target.value
            }))
          }
          placeholder="请输入搜索内容"
          prefix={<SearchOutlined />}
          maxLength={50}
          onBlur={changeArticleSearchItem}
          style={{ width: '320px' }}
        />
        <Button onClick={changeArticleSearchItem}>搜索</Button>
      </div>

      <div className="category">
        <Row>类别</Row>
        <Radio.Group
          value={articleSearchRequest.category}
          onChange={(e) =>
            setArticleSearchRequest(prev => ({
              ...prev,
              category: e.target.value
            }))
          }
        >
          <Radio.Button value="">全部</Radio.Button>
          {categoryArr.map(item => (
            <Radio.Button key={item} value={item}>
              {item}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      <div className="tag">
        <Row>标签</Row>
        <Radio.Group
          value={articleSearchRequest.tag}
          onChange={(e) =>
            setArticleSearchRequest(prev => ({
              ...prev,
              tag: e.target.value
            }))
          }
        >
          <Radio.Button value="">全部</Radio.Button>
          {tagArr.map(item => (
            <Radio.Button key={item} value={item}>
              {item}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      <div className="sort">
        <Row>排序</Row>
        <Button onClick={() => {
          handleSortClick();
          changeArticleSearchItem();
        }}>
          <SortDescendingOutlined style={{ color: downColor }} />
          <SortAscendingOutlined style={{ color: upColor }} />
        </Button>
        <Radio.Group
          value={articleSearchRequest.sort}
          onChange={(e) =>
            setArticleSearchRequest(prev => ({
              ...prev,
              sort: e.target.value
            }))
          }
        >
          {sortArr.map(item => (
            <Radio.Button key={item.value} value={item.value}>
              {item.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {/* Table with scrollable container */}
      <div className="table-container">
        <Table<Hit<Article>>
          dataSource={articleTableData}
          columns={columns}
          rowKey={(record) => record._id} // 使用 _id 作为 rowKey
          showHeader={false}
          rowClassName={() => "custom-row-class"}
          pagination={false}
          onRow={(record) => ({
            style: { height: '150px' },
            onClick: () => handleArticleJumps(record._id)
          })}
        />
      </div>

      {/* Pagination */}
      <Pagination
        current={page}
        pageSize={pageSize}
        pageSizeOptions={['5', '10', '20', '30']}
        total={total}
        showTotal={(total) => `共 ${total} 条`}
        showSizeChanger
        onChange={handleCurrentChange}
        onShowSizeChange={handleSizeChange}
        style={{ textAlign: 'center', marginTop: '20px' }}
      />
    </Card>
  );
};

export default ArticleList;