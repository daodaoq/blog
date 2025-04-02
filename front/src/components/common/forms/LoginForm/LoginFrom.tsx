import 
  React, { 
    useState, 
    useEffect 
  } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Image 
} from 'antd';
import { 
  UserOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone 
} from '@ant-design/icons';
import useUserStore from '@/stores/user';
import useLayoutStore from '@/stores/layout';
import { captcha } from '@/api/base';
import type { LoginRequest } from '@/api/user';
import './LoginForm.css';

const LoginFormComponent: React.FC = () => {
  const [form] = Form.useForm();
  const userStore = useUserStore();
  const layoutStore = useLayoutStore();
  const [picPath, setPicPath] = useState('');
  const [captchaId, setCaptchaId] = useState('');

  // 获取验证码
  const loginVerify = async () => {
    const res = await captcha();
    setPicPath(res.data.pic_path);
    setCaptchaId(res.data.captcha_id);
  };

  // 初始化时获取验证码
  useEffect(() => {
    loginVerify();
  }, []);

  // 提交表单
  const onFinish = async (values: LoginRequest) => {
    try {
      // 添加验证码 ID 到表单数据
      const formData = { ...values, captcha_id: captchaId };

      // 调用登录接口
      const success = await userStore.loginIn(formData);
      console.log('登录成功:', success); // 这里可以检查 loginIn 是否返回 true
      if (!success) {
        // 登录失败时刷新验证码
        loginVerify();
      } else {
        // 登录成功后清空表单
        form.resetFields();

        // 关闭弹窗
        layoutStore.setState({
          loginVisible: false,
          popoverVisible: false,
        });
        console.log('弹窗状态:', layoutStore);
        console.log('登录成功，弹窗已关闭');
      }
    } catch (error) {
      console.error('登录异常:', error);
      // 登录异常时刷新验证码
      loginVerify();
    }
  };

  return (
    <div className="login-form">
      <Form
        form={form}
        onFinish={onFinish}
        initialValues={{ email: '', password: '', captcha: '' }}
      >
        <Form.Item
          label="邮箱"
          name="email"
          rules={[{ required: true, type: 'email', message: '请输入正确的邮箱格式' }]}
        >
          <Input
            size="large"
            placeholder="请输入邮箱"
            suffix={<UserOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, min: 8, max: 20, message: '密码的长度应为8~20位' }]}
        >
          <Input.Password
            size="large"
            placeholder="请输入密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          label="验证码"
          name="captcha"
          rules={[{ required: true, len: 6, message: '请输入6位的验证码' }]}
        >
          <div className="captcha">
            <Input size="large" placeholder="请输入验证码" />
            <Image
              src={picPath}
              alt="验证码"
              onClick={loginVerify}
              preview={false}
            />
          </div>
        </Form.Item>

        <Form.Item>
          <Button type="primary" size="large" htmlType="submit">
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginFormComponent;