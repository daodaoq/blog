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
  Select,
  Pagination,
  Image,
  message,
} from 'antd';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  Image as ImageType, 
  ImageDeleteRequest, 
  imageDelete, 
  imageList 
} from '@/api/image';
import useLayoutStore from '@/stores/layout';
import './images.css';

const { Option } = Select;

const ImageList: React.FC = () => {
  const [imageTableData, setImageTableData] = useState<ImageType[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [imageBulkDeleteVisible, setImageBulkDeleteVisible] = useState(false);
  const [imageDeleteVisible, setImageDeleteVisible] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [imageInfo, setImageInfo] = useState<ImageType | null>(null);
  const [form] = Form.useForm();

  const location = useLocation();
  const navigate = useNavigate();
  const layoutStore = useLayoutStore();

  const categoryOptions = [
    { value: '', label: '全部' },
    { value: '未使用', label: '未使用' },
    { value: '系统', label: '系统' },
    { value: '背景', label: '背景' },
    { value: '封面', label: '封面' },
    { value: '插图', label: '插图' },
    { value: '广告', label: '广告' },
    { value: '友链', label: '友链' },
  ];

  const storageOptions = [
    { value: '', label: '全部' },
    { value: '本地', label: '本地' },
    { value: '七牛云', label: '七牛云' },
  ];

  const imageListRequest = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      name: query.get('name') || null,
      category: query.get('category') || null,
      storage: query.get('storage') || null,
      page: Number(query.get('page')) || 1,
      page_size: Number(query.get('page_size')) || 10,
    };
  }, [location.search]);

  const getImageTableData = useCallback(async () => {
    const res = await imageList(imageListRequest);
    if (res.code === 0) {
      setImageTableData(res.data.list);
      setTotal(res.data.total);
    }
  }, [imageListRequest]);

  useEffect(() => {
    getImageTableData();
  }, [getImageTableData]);

  const handleIdsToDelete = () => {
    setIdsToDelete(selectedRowKeys.map(Number));
  };

  const handleBulkDelete = async () => {
    const requestData: ImageDeleteRequest = {
      ids: idsToDelete,
    };
    const res = await imageDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setImageBulkDeleteVisible(false);
      layoutStore.setState({ shouldRefreshImageTable: true });
      getImageTableData();
    }
  };

  const handleDelete = async (id: number) => {
    const requestData: ImageDeleteRequest = {
      ids: [id],
    };
    const res = await imageDelete(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      setImageDeleteVisible(false);
      layoutStore.setState({ shouldRefreshImageTable: true });
      getImageTableData();
    }
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setPage(1);
    setPageSize(10);
    navigate({
      pathname: location.pathname,
      search: `?name=${values.name || ''}&category=${values.category || ''}&storage=${values.storage || ''}&page=1&page_size=10`,
    });
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    navigate({
      pathname: location.pathname,
      search: `?name=${imageListRequest.name || ''}&category=${imageListRequest.category || ''}&storage=${imageListRequest.storage || ''}&page=${newPage}&page_size=${newPageSize}`,
    });
  };

  const columns: ColumnsType<ImageType> = [
    {
      title: '图片',
      dataIndex: 'url',
      key: 'url',
      width: 100,
      render: (text: string) => <Image src={text} alt="图片" width={48} />,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 320,
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      width: 340,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '存储',
      dataIndex: 'storage',
      key: 'storage',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          {record.category === '未使用' && (
            <Button
              type="link"
              danger
              onClick={() => {
                setImageDeleteVisible(true);
                setImageInfo(record);
              }}
            >
              删除
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="image-list">
      <div className="title">
        <h2>图片列表</h2>
        <div className="button-group">
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setImageBulkDeleteVisible(true);
              handleIdsToDelete();
            }}
          >
            批量删除
          </Button>
        </div>
      </div>

      <Modal
        title="删除图片"
        open={imageBulkDeleteVisible}
        onOk={handleBulkDelete}
        onCancel={() => setImageBulkDeleteVisible(false)}
      >
        您已选中 [{idsToDelete.length}] 项资源，删除后将无法恢复，是否确认删除？
      </Modal>

      <div className="image-list-request">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item label="图片名称" name="name">
            <Input placeholder="请输入图片名称" />
          </Form.Item>
          <Form.Item label="图片类别" name="category">
            <Select placeholder="请选择" style={{ width: 200 }}>
              {categoryOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="存储类型" name="storage">
            <Select placeholder="请选择" style={{ width: 200 }}>
              {storageOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
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
        dataSource={imageTableData}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title="删除图片"
        open={imageDeleteVisible}
        onOk={() => handleDelete(imageInfo?.id ?? 0)}
        onCancel={() => setImageDeleteVisible(false)}
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

export default ImageList;