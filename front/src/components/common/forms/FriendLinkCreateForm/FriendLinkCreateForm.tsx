import React, { useState } from 'react';
import { 
  Button, 
  Form, 
  Input, 
  Upload, 
  message, 
  Image 
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { friendLinkCreate } from '@/api/friend-link';
import type { FriendLinkCreateRequest } from '@/api/friend-link';
import useUserStore from '@/stores/user';
import useLayoutStore from '@/stores/layout';
import type { ApiResponse, ImageUploadResponse } from '@/api/image';
import './FriendLinkCreateForm.css';

const { Item } = Form;

const FriendLinkCreateForm: React.FC = () => {
  const [form] = Form.useForm();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const userStore = useUserStore();
  const layoutStore = useLayoutStore();

  // 处理文件上传状态
  const handleUploadChange: UploadProps['onChange'] = (info) => {
    const { file } = info;
    if (file.status === 'done') {
      // 服务器返回的响应数据
      const response: ApiResponse<ImageUploadResponse> = file.response;
      if (response.code === 0) {
        setLogoUrl(response.data.url);
        message.success(response.msg || '上传成功');
      } else {
        message.error(response.msg || '上传失败');
      }
    } else if (file.status === 'error') {
      message.error('上传失败，请重试');
    }
  };

  const submitForm = async () => {
    const values = await form.validateFields();
    const requestData: FriendLinkCreateRequest = {
      logo: logoUrl,
      link: values.link,
      name: values.name,
      description: values.description,
    };

    const res = await friendLinkCreate(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      layoutStore.setState({ shouldRefreshFriendLinkTable: true });
      layoutStore.setState({ friendLinkCreateVisible: false });
    }
  };

  return (
    <div className="friend-link-create-form">
      <Form form={form} layout="vertical">
        {/* 确保 Form.Item 只包含一个子组件 */}
        <Item
          label="logo图片"
          name="logo"
          valuePropName="fileList" // 指定表单值的来源
          getValueFromEvent={(e) => e.fileList} // 从事件中获取值
        >
          <Upload
            action={`${import.meta.env.VITE_BASE_API}/image/upload`}
            headers={{ 'x-access-token': userStore.accessToken }}
            showUploadList={false}
            onChange={handleUploadChange} // 使用 onChange 监听上传状态
            name="image"
            withCredentials
          >
            {logoUrl ? (
              <Image src={logoUrl} alt="logo" style={{ width: '100%', height: '120px' }} />
            ) : (
              <div className="upload-content">
                <div className="container">
                  <UploadOutlined className="upload-icon" />
                  <div className="upload-text">拖拽文件或点击上传</div>
                </div>
              </div>
            )}
          </Upload>
        </Item>

        <Item label="友链链接" name="link" rules={[{ required: true, message: '请输入友链链接' }]}>
          <Input placeholder="请输入友链链接" size="large" />
        </Item>

        <Item label="友链名称" name="name" rules={[{ required: true, message: '请输入友链名称' }]}>
          <Input placeholder="请输入友链名称" size="large" />
        </Item>

        <Item label="友链描述" name="description">
          <Input placeholder="请输入友链描述" size="large" />
        </Item>

        <Item>
          <div className="button-group">
            <Button type="primary" size="large" onClick={submitForm}>
              确定
            </Button>
            <Button size="large" onClick={() => layoutStore.setState({ friendLinkCreateVisible: false })}>
              取消
            </Button>
          </div>
        </Item>
      </Form>
    </div>
  );
};

export default FriendLinkCreateForm;
