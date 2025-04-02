import 
  React, { 
    useState, 
    useEffect 
  } from 'react';
import { Form, Input, Button, Image, message } from 'antd';
import useLayoutStore from '@/stores/layout';
import { captcha, sendEmailVerificationCode, type EmailRequest } from '@/api/base';
import { forgotPassword, type ForgotPasswordRequest } from '@/api/user';
import './ForgotPasswordForm.css';
import type { Rule } from 'antd/lib/form';

const ForgotPasswordFormComponent: React.FC = () => {
  const [form] = Form.useForm();
  const layoutStore = useLayoutStore();
  const [picPath, setPicPath] = useState('');
  const [forgotPasswordFormData, setForgotPasswordFormData] = useState<ForgotPasswordRequest>({
    email: '',
    verification_code: '',
    new_password: '',
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
    email: [{ required: true, type: 'email', message: '请输入正确的邮箱格式' }],
    verification_code: [{ required: true, len: 6, message: '请输入6位的验证码' }],
    new_password: [{ required: true, min: 8, max: 20, message: '密码的长度应为8~20位' }],
  };

  // 获取图片验证码
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

  // 发送验证码，并启用60s倒计时
  const sendCode = async () => {
    if (isCounting) return; // 倒计时期间不能重复发送

    setEmailRequest((prevData) => ({
      ...prevData,
      email: forgotPasswordFormData.email,
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

  // 提交表单
  const submitForm = async () => {
    try {
      await form.validateFields();
      if (forgotPasswordFormData.new_password !== repeatPassword) {
        message.error('两次密码不一致！');
        return;
      }
      const res = await forgotPassword(forgotPasswordFormData);
      if (res.code === 0) {
        message.success(res.msg);
        layoutStore.setState({
          forgotPasswordVisible: false,
          popoverVisible: false,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="forgot-password-form">
      <Form
        form={form}
        initialValues={{ ...forgotPasswordFormData, ...emailRequest }}
        onValuesChange={(changedValues) => {
          setForgotPasswordFormData((prevData) => ({
            ...prevData,
            ...changedValues,
          }));
          setEmailRequest((prevData) => ({
            ...prevData,
            ...changedValues,
          }));
          if (changedValues.new_password) {
            setRepeatPassword('');
          }
        }}
      >
        <Form.Item label="邮箱" name="email" rules={rules.email}>
          <Input size="large" placeholder="请输入邮箱" />
        </Form.Item>

        {/* 图片验证码 */}
        <Form.Item label="验证码" name="captcha" rules={[{ required: true, len: 6, message: '请输入6位的验证码' }]}>
          <div className="captcha">
            <Input size="large" placeholder="请输入图片验证码" maxLength={6} minLength={6} />
            <Image src={picPath} alt="验证码" preview={false} onClick={emailVerify} style={{ cursor: 'pointer', marginLeft: 10 }} />
            <Button onClick={sendCode} disabled={isCounting} style={{ marginLeft: 10 }}>
              {isCounting ? `${countdown}s 后可重发` : '发送验证码'}
            </Button>
          </div>
        </Form.Item>

        <Form.Item label="邮箱验证码" name="verification_code" rules={rules.verification_code}>
          <Input size="large" placeholder="请输入邮箱验证码" />
        </Form.Item>

        <Form.Item label="密码" name="new_password" rules={rules.new_password}>
          <Input.Password size="large" placeholder="请输入新密码" />
        </Form.Item>

        <Form.Item label="确认密码">
          <Input.Password
            size="large"
            placeholder="请再次输入新密码"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
          />
          {forgotPasswordFormData.new_password !== repeatPassword && (
            <span style={{ color: 'red' }}>两次密码不一致！</span>
          )}
        </Form.Item>

        <Form.Item>
          <Button type="primary" size="large" onClick={submitForm}>
            确定
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ForgotPasswordFormComponent;
