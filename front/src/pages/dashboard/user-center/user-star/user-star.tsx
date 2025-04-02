import 
  React, { 
    useEffect, 
    useState, 
    useCallback 
  } from 'react';
import { 
  Table, 
  Pagination, 
  Image, 
  Tag, 
  Typography 
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useLocation, useNavigate } from 'react-router-dom';
import { articleLikesList, type Article } from '@/api/article';
import type { Hit, PageInfo } from '@/api/common';
import './user-star.css';

const { Link, Paragraph } = Typography;

const UserStar: React.FC = () => {
  const [articleLikesListData, setArticleLikesListData] = useState<Hit<Article>[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  // 从 URL 中获取分页参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const pageFromUrl = Number(searchParams.get('page')) || 1;
    const pageSizeFromUrl = Number(searchParams.get('page_size')) || 10;

    setPage(pageFromUrl);
    setPageSize(pageSizeFromUrl);
  }, [location.search]);

  // 获取收藏文章列表
  const getArticleLikesListData = useCallback(async () => {
    const request: PageInfo = {
      page,
      page_size: pageSize,
    };

    const response = await articleLikesList(request);
    if (response.code === 0 && response.data) {
      setArticleLikesListData(response.data.list);
      setTotal(response.data.total);
    }
  }, [page, pageSize]);

  // 监听分页参数变化
  useEffect(() => {
    getArticleLikesListData();
  }, [getArticleLikesListData]);

  // 处理分页变化
  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    navigate({
      pathname: location.pathname,
      search: `?page=${newPage}&page_size=${newPageSize}`,
    });
  };

  // 表格列配置
  const columns: ColumnsType<Hit<Article>> = [
    {
      title: '封面',
      dataIndex: '_source',
      key: 'cover',
      width: 100,
      render: (source: Article) => <Image src={source.cover} alt="封面" width={50} />,
    },
    {
      title: '标题',
      dataIndex: ['_source', 'title'],
      key: 'title',
      width: 120,
    },
    {
      title: '类别',
      dataIndex: ['_source', 'category'],
      key: 'category',
      width: 80,
    },
    {
      title: '标签',
      dataIndex: ['_source', 'tags'],
      key: 'tags',
      width: 120,
      render: (tags: string[]) => (
        <>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '简介',
      dataIndex: ['_source', 'abstract'],
      key: 'abstract',
      render: (abstract: string) => (
        <Paragraph ellipsis={{ rows: 5, expandable: true }}>{abstract}</Paragraph>
      ),
    },
    {
      title: '发布时间',
      dataIndex: ['_source', 'created_at'],
      key: 'created_at',
      width: 102,
    },
    {
      title: '文章ID',
      dataIndex: '_id',
      key: 'id',
      width: 200,
      render: (id: string) => <Link href={`/article/${id}`}>{id}</Link>,
    },
  ];

  return (
    <div className="user-star">
      <div className="title">我的收藏</div>

      <Table
        dataSource={articleLikesListData}
        columns={columns}
        rowKey="_id"
        pagination={false}
        bordered
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
    </div>
  );
};

export default UserStar;