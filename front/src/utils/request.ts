import axios from 'axios';
import type {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import { message, Modal } from 'antd';
import useUserStore from '../stores/user';
import useLayoutStore from '../stores/layout';
import { useNavigate } from 'react-router-dom';

// 创建一个 axios 实例，配置基础 URL 和请求超时时间
const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API, // 从环境变量中获取基础 API 地址
  timeout: 10000, // 请求超时时间为 10 秒
});

// 定义一个泛型接口 ApiResponse，用于描述 API 响应的结构
export interface ApiResponse<T> {
  code: number; // 响应状态码
  msg: string; // 响应消息
  data: T; // 响应数据，类型由泛型 T 决定
}

// 请求拦截器，在请求发送之前进行一些处理
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 从用户状态管理中获取 accessToken
    const { accessToken } = useUserStore.getState();
    // 设置请求头，包含 Content-Type 和 x-access-token
    config.headers = {
      'Content-Type': 'application/json',
      'x-access-token': accessToken,
      ...config.headers, // 保留原有的请求头
    };
    // 强制将 config 转换为 InternalAxiosRequestConfig 类型并返回
    return config as InternalAxiosRequestConfig;
  },
  (error: AxiosError) => {
    // 请求发生错误时，使用 message 组件显示错误信息
    message.error(error.message);
    // 返回一个被拒绝的 Promise，将错误传递下去
    return Promise.reject(error);
  }
);

// 响应拦截器，在响应返回之后进行一些处理
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 获取用户状态管理的实例
    const userStore = useUserStore.getState();

    // 如果响应头中包含 new-access-token，则更新用户状态中的 accessToken
    if (response.headers['new-access-token']) {
      useUserStore.setState({ accessToken: response.headers['new-access-token'] });
    }
    // 如果响应数据中的 code 不为 0，表示请求失败
    if (response.data.code !== 0) {
      // 使用 message 组件显示错误信息
      message.error(response.data.msg);

      // 如果响应数据中的 data 包含 reload 字段
      if (response.data.data?.reload) {
        // 重置用户状态
        userStore.reset();
        // 清空本地存储
        localStorage.clear();
        // 获取导航函数
        const navigate = useNavigate();
        // 导航到首页
        navigate('/index');
        // 更新布局状态，显示登录弹窗
        useLayoutStore.setState({ popoverVisible: true, loginVisible: true });
      }
    }
    // 返回响应数据
    return response.data;
  },
  (error: AxiosError) => {
    // 获取导航函数
    const navigate = useNavigate();
    // 如果没有响应数据，说明请求未成功发出
    if (!error.response) {
      // 使用 Modal 组件显示错误提示框
      Modal.confirm({
        title: '请求报错',
        content: `检测到请求错误：${error.message}`,
        okText: '稍后重试',
        cancelText: '取消',
      });
      // 返回一个被拒绝的 Promise，将错误传递下去
      return Promise.reject(error);
    }

    // 根据不同的响应状态码进行不同的错误处理
    switch (error.response.status) {
      case 500:
        // 处理 500 错误，传递状态码、错误对象和导航函数
        handleSpecificError(500, error, navigate);
        break;
      case 404:
        // 处理 404 错误，传递状态码、错误对象和导航函数
        handleSpecificError(404, error, navigate);
        break;
      case 403:
        // 处理 403 错误，传递状态码、错误对象和导航函数
        handleSpecificError(403, error, navigate);
        break;
    }
    // 返回一个被拒绝的 Promise，将错误传递下去
    return Promise.reject(error);
  }
);

// 处理具体错误状态的函数
const handleSpecificError = (status: number, error: AxiosError, navigate: (path: string) => void) => {
  // 获取用户状态管理的实例
  const userStore = useUserStore.getState();

  // 定义不同状态码对应的错误提示信息
  const errorMessages: { [key: number]: string } = {
    500: `
      <p>检测到接口错误: ${error.message}</p>
      <p>错误码：<span style="color:red">500</span></p>
      <p>此类错误通常由后台服务器发生不可预料的错误（如panic）引起。请先查看后台日志以获取更多信息。</p>
      <p>如果此错误影响您的正常使用，建议您清理缓存并重新登录。</p>
    `,
    404: `
      <p>检测到接口错误: ${error.message}</p>
      <p>错误码：<span style="color:red">404</span></p>
      <p>此错误通常表示请求的接口未注册（或服务未重启）或请求路径（方法）与API路径（方法）不符。</p>
      <p>请检查您请求的URL和方法，确保它们正确无误。</p>
    `,
    403: `
      <p>检测到权限错误: ${error.message}</p>
      <p>错误码：<span style="color:red">403</span></p>
      <p>您没有权限访问此路由（admin）。请确认您的用户角色是否具备访问该页面的权限。</p>
      <p>如果您认为这是一个错误，请联系系统管理员获取帮助。</p>
    `,
  };

  // 使用 Modal 组件显示错误提示框
  Modal.confirm({
    title: '接口报错',
    content: errorMessages[status],
    okText: '清理缓存',
    cancelText: '取消',
    onOk: () => {
      // 重置用户状态
      userStore.reset();
      // 清空本地存储
      localStorage.clear();
      // 导航到首页
      navigate('/index');
      // 更新布局状态，显示登录弹窗
      useLayoutStore.setState({ popoverVisible: true, loginVisible: true });
    },
  });
};

// 导出 axios 实例
export default service;