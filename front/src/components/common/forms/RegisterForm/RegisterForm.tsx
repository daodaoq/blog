import 
  React, { 
    useState, 
    useEffect 
  } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Image, 
  message 
} from 'antd';
import useUserStore from '@/stores/user';
import useLayoutStore from '@/stores/layout';
import { 
  captcha, 
  sendEmailVerificationCode, 
  type EmailRequest 
} from '@/api/base';
import { type RegisterRequest } from '@/api/user';
import './RegisterForm.css';
import type { Rule } from 'antd/lib/form';

const RegisterFormComponent: React.FC = () => {
  const [form] = Form.useForm();
  const userStore = useUserStore();
  const layoutStore = useLayoutStore();
  const [picPath, setPicPath] = useState('');
  const [registerFormData, setRegisterFormData] = useState<RegisterRequest>({
    username: '',
    password: '',
    email: '',
    verification_code: '',
  });
  const [repeatPassword, setRepeatPassword] = useState('');
  const [emailRequest, setEmailRequest] = useState<EmailRequest>({
    email: '',
    captcha: '',
    captcha_id: '',
  });

  // 60s倒计时
  const [countdown, setCountdown] = useState(0);
  const [isCounting, setIsCounting] = useState(false);

  const rules: { [key: string]: Rule[] } = {
    username: [{ required: true, max: 20, message: '用户名长度不应大于20位' }],
    password: [{ required: true, min: 8, max: 20, message: '密码的长度应为8~20位' }],
    email: [{ required: true, type: 'email', message: '请输入正确的邮箱格式' }],
    verification_code: [{ required: true, len: 6, message: '请输入6位的验证码' }],
  };

  // 获取验证码
  const emailVerify = async () => {
    const res = await captcha();
    setPicPath(res.data.pic_path);
    setEmailRequest((prevData) => ({
      ...prevData,
      captcha_id: res.data.captcha_id,
    }));
  };

  useEffect(() => {
    emailVerify();
  }, []);

  // 发送邮箱验证码
  const sendCode = async () => {
    if (isCounting) return; // 倒计时期间不能重复发送

    setEmailRequest((prevData) => ({
      ...prevData,
      email: registerFormData.email,
    }));

    const res = await sendEmailVerificationCode(emailRequest);
    if (res.code === 0) {
      message.success(res.msg);
      setCountdown(60);
      setIsCounting(true);
    } else {
      emailVerify();
    }
  };

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCounting(false);
    }
  }, [countdown]);

  const submitForm = async () => {
    try {
      await form.validateFields();
      if (registerFormData.password !== repeatPassword) {
        message.error('两次密码不一致！');
        return;
      }
      const flag = await userStore.registerIn(registerFormData);
      if (flag) {
        layoutStore.setState({
          registerVisible: false,
          popoverVisible: false,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="register-form">
      <Form
        form={form}
        initialValues={{ ...registerFormData, ...emailRequest }}
        onValuesChange={(changedValues) => {
          setRegisterFormData((prevData) => ({
            ...prevData,
            ...changedValues,
          }));
          setEmailRequest((prevData) => ({
            ...prevData,
            ...changedValues,
          }));
          if (changedValues.password) {
            setRepeatPassword('');
          }
        }}
      >
        <Form.Item label="用户名" name="username" rules={rules.username} validateTrigger="blur">
          <Input size="large" placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item label="密码" name="password" rules={rules.password} validateTrigger="change">
          <Input.Password size="large" placeholder="请输入密码" />
        </Form.Item>

        <Form.Item label="确认密码">
          <Input.Password
            size="large"
            placeholder="请再次输入密码"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
          />
          {registerFormData.password !== repeatPassword && (
            <span style={{ color: 'red' }}>两次密码不一致！</span>
          )}
        </Form.Item>

        <Form.Item label="邮箱" name="email" rules={rules.email} validateTrigger="blur">
          <Input size="large" placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item label="验证码" name="captcha" rules={[{ required: true, len: 6, message: '请输入6位的验证码' }]}>
          <div className="captcha">
            <Input size="large" placeholder="请输入图片验证码" maxLength={6} minLength={6} />
            <Image src={picPath} alt="验证码" preview={false} onClick={emailVerify} style={{ cursor: 'pointer' }} />
            <Button onClick={sendCode} disabled={isCounting}>
              {isCounting ? `${countdown}s 后可重发` : '发送验证码'}
            </Button>
          </div>
        </Form.Item>

        <Form.Item label="邮箱验证码" name="verification_code" rules={rules.verification_code} validateTrigger="blur">
          <Input size="large" placeholder="请输入邮箱验证码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" size="large" onClick={submitForm}>
            注册
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterFormComponent;
