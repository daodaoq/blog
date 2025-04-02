import 
  React, { 
    useState, 
    useRef 
  } from 'react';
import useUserStore from '@/stores/user';
import useLayoutStore from '@/stores/layout';
import axios, { CancelTokenSource } from 'axios';
import './ArticleCreateForm.css';

interface FileInfo {
  uid: string;
  url: string;
  name: string;
  status: 'done' | 'uploading' | 'error';
}

interface ArticleCreateFormProps {
  title?: string;
  content?: string;
}

let cancelTokenSource: CancelTokenSource = axios.CancelToken.source();

const ArticleCreateForm: React.FC<ArticleCreateFormProps> = ({ title, content }) => {
  const userStore = useUserStore();
  const layoutStore = useLayoutStore();
  const [formData, setFormData] = useState({
    title: title || '',
    category: '',
    abstract: '',
    content: content || '',
    cover: '',
    tags: [] as string[],
  });
  const [fileList, setFileList] = useState<FileInfo[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 关闭标签
  const handleClose = (tag: string) => {
    console.log('关闭标签:', tag);
    setFormData(prevData => ({
      ...prevData,
      tags: prevData.tags.filter(t => t !== tag),
    }));
  };

  // 显示标签输入框
  const showInput = () => {
    console.log('显示标签输入框');
    setInputVisible(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // 确认输入标签
  const handleInputConfirm = () => {
    console.log('确认输入标签:', inputValue);
    if (inputValue && !formData.tags.includes(inputValue)) {
      setFormData(prevData => ({
        ...prevData,
        tags: [...prevData.tags, inputValue],
      }));
    }
    setInputVisible(false);
    setInputValue('');
  };

  // 自定义封面上传
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (cancelTokenSource !== null) {
      cancelTokenSource.cancel('取消之前的上传请求');
    }
    cancelTokenSource = axios.CancelToken.source();

    const file = e.target.files && e.target.files[0];
    if (!file) {
      console.log('没有选择文件');
      return;
    }

    console.log('开始上传文件:', file.name);

    const formDataForUpload = new FormData();
    formDataForUpload.append('image', file);

    try {
      const response = await axios.post('/api/image/upload', formDataForUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-access-token': userStore.accessToken,
        },
        withCredentials: true,
        cancelToken: cancelTokenSource.token,
        timeout: 5000,
      });

      console.log('上传响应:', response.data);

      if (response.data.code === 0) {
        const imageUrl = response.data.data.url;
        setFormData(prevData => ({
          ...prevData,
          cover: imageUrl,
        }));
        setFileList([
          {
            uid: '-1',
            url: imageUrl,
            name: file.name,
            status: 'done',
          },
        ]);
        console.log('封面上传成功:', imageUrl);
      } else {
        console.error('封面上传失败:', response.data.msg || '未知错误');
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('请求被取消:', error.message);
      } else if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.error('请求超时，请重试');
      } else {
        console.error('网络错误，上传失败', error);
      }
    }
  };

  // 处理输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`输入变化: ${name} = ${value}`);
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // 提交表单
  const submitForm = async () => {
    console.log('提交表单开始，当前数据:', formData);

    if (!formData.title || !formData.category || !formData.abstract || !formData.content) {
      console.error('请填写所有必填字段');
      return;
    }

    const request = {
      ...formData,
    };
    console.log('请求数据:', request);

    try {
      const response = await axios.post('/api/article/create', request, {
        timeout: 5000,
      });
      console.log('响应数据:', response.data);

      if (response.data.code === 0) {
        console.log('文章发布成功');
        layoutStore.setState({ articleCreateVisible: false });
        setFormData({
          title: '',
          category: '',
          abstract: '',
          content: '',
          cover: '',
          tags: [],
        });
        setFileList([]);
      } else {
        console.error('发布失败:', response.data.msg || '未知错误');
      }
    } catch (error) {
      console.error('网络错误，文章发布失败', error);
      if (axios.isAxiosError(error)) {
        console.error('请求错误信息:', error.response?.data || '没有响应数据');
      }
    }
  };

  return (
    <div className="article-create-form">
      {/* 封面上传 */}
      <div className="form-item">
        <label htmlFor="cover">文章封面</label>
        <input type="file" id="cover" accept="image/*" onChange={handleUpload} />
        {fileList.length > 0 && fileList.map(file => (
          <img key={file.uid} src={file.url} alt={file.name} style={{ maxWidth: '200px' }} />
        ))}
      </div>

      {/* 标题 */}
      <div className="form-item">
        <label htmlFor="title">文章标题</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="请输入文章标题"
        />
      </div>

      {/* 文章类别 */}
      <div className="form-item">
        <label htmlFor="category">文章类别</label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          placeholder="请输入文章类别"
        />
      </div>

      {/* 文章标签 */}
      <div className="form-item">
        <label>文章标签</label>
        {formData.tags.map(tag => (
          <span key={tag} className="tag" onClick={() => handleClose(tag)}>
            {tag} &times;
          </span>
        ))}
        {inputVisible ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInputConfirm();
              }
            }}
            style={{ width: '80px' }}
          />
        ) : (
          <button onClick={showInput}>+ 新建标签</button>
        )}
      </div>

      {/* 文章简介 */}
      <div className="form-item">
        <label htmlFor="abstract">文章简介</label>
        <textarea
          id="abstract"
          name="abstract"
          value={formData.abstract}
          onChange={handleInputChange}
          placeholder="请输入文章简介"
        />
      </div>

      {/* 文章内容 */}
      <div className="form-item">
        <label htmlFor="content">文章内容</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          placeholder="请输入文章内容"
          rows={8}
        />
      </div>

      {/* 按钮 */}
      <div className="button-group">
        <button type="button" onClick={submitForm}>确定</button>
        <button type="button" onClick={() => layoutStore.setState({ articleCreateVisible: false })}>取消</button>
      </div>
    </div>
  );
};

export default ArticleCreateForm;
