import 
  React, { 
    useState, 
    useEffect 
  } from 'react';
import { 
  Form, 
  Input, 
  Switch, 
  Button, 
  Modal 
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';
import axios from 'axios';
import useLayoutStore from '@/stores/layout';
import ArticleCreateForm from '@/components/common/forms/ArticleCreateForm/ArticleCreateForm';
import type { ApiResponse } from '@/utils/request';
import type { ImageUploadResponse } from '@/api/image';

const mdParser = new MarkdownIt();

const ArticlePublish: React.FC = () => {
  const layoutStore = useLayoutStore();
  const [title, setTitle] = useState(localStorage.getItem('title') || '');
  const [text, setText] = useState(localStorage.getItem('article') || '');
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(
    localStorage.getItem('isAutoSaveEnabled') === 'true'
  );
  const [articleCreateVisible, setArticleCreateVisible] = useState(
    layoutStore.articleCreateVisible
  );

  // 监听 title 变化并保存到 localStorage
  useEffect(() => {
    localStorage.setItem('title', title);
  }, [title]);

  // 监听 text 变化并保存到 localStorage
  useEffect(() => {
    localStorage.setItem('article', text);
  }, [text]);

  // 监听 isAutoSaveEnabled 变化并保存到 localStorage
  useEffect(() => {
    localStorage.setItem('isAutoSaveEnabled', String(isAutoSaveEnabled));
  }, [isAutoSaveEnabled]);

  // 监听 layoutStore.articleCreateVisible 变化
  useEffect(() => {
    setArticleCreateVisible(layoutStore.articleCreateVisible);
  }, [layoutStore.articleCreateVisible]);

  // 图片上传
  const handleUploadImg = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('image', file);

    try {
      const response = await axios.post<ApiResponse<ImageUploadResponse>>('/api/image/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });
      return response.data.data.url; // 返回上传后的图片 URL
    } catch (error) {
      console.error('图片上传失败:', error);
      throw new Error('图片上传失败');
    }
  };

  // 保存内容
  const handleSave = (value: string) => {
    localStorage.setItem('article', value);
  };

  // 内容变化时的处理
  const handleChange = (value: string) => {
    setText(value);
    if (isAutoSaveEnabled) {
      handleSave(value);
    }
  };

  // 清空文章
  const handleClear = () => {
    setTitle('');
    setText('');
  };

  // 控制弹窗显示与隐藏
  const handleArticleCreateVisible = (visible: boolean) => {
    layoutStore.setState({ articleCreateVisible: visible });
  };

  return (
    <div className="article-publish">
      <div className="title">
        <div className="left">
          <Form layout="inline">
            <Form.Item label="文章标题">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入文章标题"
                style={{ minWidth: '400px' }}
              />
            </Form.Item>
          </Form>
        </div>
        <div className="right">
          <span>自动保存</span>
          <Switch
            checked={isAutoSaveEnabled}
            onChange={(checked) => setIsAutoSaveEnabled(checked)}
            style={{ margin: '0 20px' }}
          />
          <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleClear}>
            清空文章
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleArticleCreateVisible(true)}
            style={{ marginLeft: '10px' }}
          >
            发布文章
          </Button>
        </div>
      </div>

      <MdEditor
        value={text}
        style={{ height: '95%' }}
        renderHTML={(text) => mdParser.render(text)}
        onChange={({ text }) => handleChange(text)}
        onImageUpload={handleUploadImg} // 直接传递 handleUploadImg
      />

      <Modal
        title="发布文章"
        open={articleCreateVisible}
        width={500}
        centered
        destroyOnClose
        onCancel={() => handleArticleCreateVisible(false)}
        footer={null}
      >
        <ArticleCreateForm title={title} content={text} />
      </Modal>
    </div>
  );
};

export default ArticlePublish;