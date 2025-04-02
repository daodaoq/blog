import React from 'react';
import { 
  Button, 
  Form, 
  Input, 
  Image, 
  message 
} from 'antd';
import type { FriendLink, FriendLinkUpdateRequest } from '@/api/friend-link';
import { friendLinkUpdate } from '@/api/friend-link';
import useLayoutStore from '@/stores/layout';
import './FriendLinkUpdateForm.css';

const { Item } = Form;

interface FriendLinkUpdateFormProps {
  friendLink: FriendLink;
}

const FriendLinkUpdateForm: React.FC<FriendLinkUpdateFormProps> = ({ friendLink }) => {
  const [form] = Form.useForm();
  const layoutStore = useLayoutStore();

  const initialValues: FriendLinkUpdateRequest = {
    id: friendLink.id,
    link: friendLink.link,
    name: friendLink.name,
    description: friendLink.description,
  };

  const submitForm = async () => {
    const values = await form.validateFields();
    const requestData: FriendLinkUpdateRequest = {
      id: friendLink.id,
      link: values.link,
      name: values.name,
      description: values.description,
    };

    const res = await friendLinkUpdate(requestData);
    if (res.code === 0) {
      message.success(res.msg);
      layoutStore.setState({ shouldRefreshFriendLinkTable: true });
      layoutStore.setState({ friendLinkUpdateVisible: false });
    }
  };

  return (
    <div className="friend-link-update-form">
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Item label="logo图片" name="logo">
          <Image src={friendLink.logo} alt="logo" style={{ width: '100%', height: '120px' }} />
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
            <Button
              size="large"
              onClick={() => layoutStore.setState({ friendLinkUpdateVisible: false })}
            >
              取消
            </Button>
          </div>
        </Item>
      </Form>
    </div>
  );
};

export default FriendLinkUpdateForm;