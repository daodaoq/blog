import 
  React, { 
    useEffect, 
    useState 
  } from 'react';
import { 
  Col, 
  Row, 
  Form, 
  Input, 
  Button, 
  Image, 
  Modal, 
  message 
} from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import useUserStore from '@/stores/user';
import useLayoutStore from '@/stores/layout';
import { userChangeInfo, UserChangeInfoRequest } from '@/api/user';
import PasswordResetForm from '@/components/common/forms/ForgotPasswordForm/ForgotPasswordForm';
import UserCard from '@/components/widgets/UserCard/UserCard';
import './user-info.css';

const { TextArea } = Input;

interface UserCardResponse {
  uuid: string;
  username: string;
  avatar: string;
  address: string;
  signature: string;
}

const UserInfo: React.FC = () => {
  const [form] = Form.useForm();
  const userStore = useUserStore();
  const layoutStore = useLayoutStore();
  const [passwordResetVisible, setPasswordResetVisible] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [userCardInfo, setUserCardInfo] = useState<UserCardResponse | null>(null);

  const userInfo = userStore.userInfo;
  console.log(userInfo)
  // 同步密码重置弹窗状态
  useEffect(() => {
    setPasswordResetVisible(layoutStore.passwordResetVisible);
  }, [layoutStore.passwordResetVisible]);

  // 关闭密码重置弹窗
  const handlePasswordResetClose = () => {
    layoutStore.setState({ passwordResetVisible: false });
  };

  // 更新用户信息
  const updateUserInfo = async (values: UserChangeInfoRequest) => {
    try {
      const res = await userChangeInfo(values);
      if (res.code === 0) {
        message.success('用户信息更新成功');
        setCardKey((prev) => prev + 1);
        await userStore.initializeUserInfo();
      } else {
        message.error('用户信息更新失败');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      message.error('用户信息更新失败');
    }
  };

  // 处理 UserCard 数据变化
  const handleUserCardInfoChange = (newUserCardInfo: UserCardResponse) => {
    setUserCardInfo(newUserCardInfo);
  };

  return (
    <div className="user-info">
      <Row gutter={24}>
        {/* 左侧：用户信息 */}
        <Col span={12}>
          <div className="info">
            <div className="title">
              <span className="title-border">用户信息</span>
            </div>
            <div className="content">
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  username: userInfo.username,
                  address: userInfo.address,
                  signature: userInfo.signature,
                }}
                onFinish={updateUserInfo}
                onFinishFailed={() => message.error('表单验证失败')}
              >
                <Form.Item label="头像">
                  <Image src={userInfo.avatar} width={50} height={50} alt="用户头像" preview={false} />
                </Form.Item>
                <Form.Item label="UUID">
                  <Input value={userInfo.uuid} disabled />
                </Form.Item>
                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[{ required: true, max: 20, message: '用户名长度不应大于20位' }]}
                  validateTrigger="onBlur"
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item
                  label="地址"
                  name="address"
                  rules={[{ max: 200, message: '地址长度不应大于200位' }]}
                  validateTrigger="onBlur"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="签名"
                  name="signature"
                  rules={[{ max: 320, message: '签名长度不应大于320位' }]}
                  validateTrigger="onBlur"
                >
                  <TextArea rows={2} />
                </Form.Item>
                <Form.Item label="邮箱">
                  <Input value={userInfo.email} disabled />
                </Form.Item>
                <Form.Item label="用户权限">
                  <Input value={userInfo.role_id === 1 ? '普通用户' : '管理员'} disabled />
                </Form.Item>
                <Form.Item label="注册来源">
                  <Input value={userInfo.register} disabled />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    保存
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>

          {/* 操作区域 */}
          {userInfo.register === '邮箱' && (
            <div className="operation">
              <div className="title">
                <span className="title-border">操作</span>
              </div>
              <div className="content">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => layoutStore.setState({ passwordResetVisible: true })}
                >
                  修改密码
                </Button>
              </div>
            </div>
          )}

          {/* 修改密码弹窗 */}
          <Modal
            title="修改密码"
            open={passwordResetVisible}
            onCancel={handlePasswordResetClose}
            footer={null}
            destroyOnClose
          >
            <PasswordResetForm />
          </Modal>
        </Col>

        {/* 右侧：用户卡片 */}
        <Col span={12}>
          <div className="card">
            <div className="title">
              <span className="title-border">用户卡片</span>
            </div>
            <div className="content">
              <UserCard
                key={cardKey}
                uuid={userInfo.uuid}
                userCardInfo={userCardInfo}
                onUserCardInfoChange={handleUserCardInfoChange}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default UserInfo;