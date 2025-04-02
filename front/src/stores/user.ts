// 从 zustand 库导入 create 函数，用于创建状态管理 store
import { create } from 'zustand';
// 从 zustand/middleware 导入 persist 函数，用于实现状态的持久化存储
import { persist } from 'zustand/middleware';
// 从 '../api/user' 模块导入登录、登出、注册和获取用户信息的 API 函数
import { login, logout, register, userInfo } from '../api/user';
// 从 '../api/user' 模块导入 User、LoginRequest 和 RegisterRequest 类型
import type { User, LoginRequest, RegisterRequest } from '../api/user';

// 定义 UserState 接口，描述用户状态的结构和操作方法
interface UserState {
  // 用户信息对象
  userInfo: User;
  // 访问令牌
  accessToken: string;
  // 用户是否之前登录过的标志
  isUserLoggedInBefore: boolean;
  // 用户信息是否已初始化的标志
  userInfoInitialized: boolean;
  // 登录方法，接受登录信息并返回一个布尔值的 Promise
  loginIn: (loginInfo: LoginRequest) => Promise<boolean>;
  // 注册方法，接受注册信息并返回一个布尔值的 Promise
  registerIn: (registerInfo: RegisterRequest) => Promise<boolean>;
  // 登出方法，接受一个导航函数，返回一个 void 类型的 Promise
  loginOut: (navigate: (path: string) => void) => Promise<void>;
  // 初始化用户信息的方法，返回一个 void 类型的 Promise
  initializeUserInfo: () => Promise<void>;
  // 重置状态的方法
  reset: () => void;
  // 判断用户是否已登录的方法
  isLoggedIn: () => boolean;
  // 判断用户是否是管理员的方法
  isAdmin: () => boolean;
}

// 使用 create 函数创建一个用户状态管理 store
const useUserStore = create<UserState>()(
  // 使用 persist 中间件实现状态的持久化存储
  persist(
    // 状态初始化函数，接受 set 和 get 函数作为参数
    (set, get) => ({
      // 初始化用户信息，设置默认值
      userInfo: {
        id: 0,
        created_at: new Date(),
        updated_at: new Date(),
        uuid: '',
        username: '',
        email: '',
        openid: '',
        avatar: '',
        address: '',
        signature: '',
        role_id: 0,
        register: '',
        freeze: false,
      },
      // 初始化访问令牌为空字符串
      accessToken: '',
      // 初始化用户是否之前登录过的标志为 false
      isUserLoggedInBefore: false,
      // 初始化用户信息是否已初始化的标志为 false
      userInfoInitialized: false,

      // 登录方法的实现
      loginIn: async (loginInfo: LoginRequest) => {
        // 调用登录 API 函数
        const res = await login(loginInfo);
        // 如果登录成功
        if (res.code === 0) {
          // 更新状态
          set({
            userInfo: res.data.user,
            accessToken: res.data.access_token,
            isUserLoggedInBefore: true,
          });
          return true;
        }
        return false;
      },

      // 注册方法的实现
      registerIn: async (registerInfo: RegisterRequest) => {
        // 调用注册 API 函数
        const res = await register(registerInfo);
        // 如果注册成功
        if (res.code === 0) {
          // 更新状态
          set({
            userInfo: res.data.user,
            accessToken: res.data.access_token,
            isUserLoggedInBefore: true,
          });
          return true;
        }
        return false;
      },

      // 登出方法的实现
      loginOut: async (navigate: (path: string) => void) => {
        // 调用登出 API 函数
        await logout();
        // 调用重置状态方法
        get().reset();
        // 清除本地存储
        localStorage.clear();
        // 使用传入的导航函数导航到首页
        navigate('/index');
      },

      // 初始化用户信息方法的实现
      initializeUserInfo: async () => {
        // 如果用户之前登录过且用户信息未初始化
        if (get().isUserLoggedInBefore && !get().userInfoInitialized) {
          // 调用获取用户信息的 API 函数
          const res = await userInfo();
          // 如果获取成功
          if (res.code === 0) {
            // 更新状态
            set({ userInfo: res.data, userInfoInitialized: true });
          }
        }
      },

      // 重置状态方法的实现
      reset: () => {
        // 重置状态为初始值
        set({
          userInfo: {
            id: 0,
            created_at: new Date(),
            updated_at: new Date(),
            uuid: '',
            username: '',
            email: '',
            openid: '',
            avatar: '',
            address: '',
            signature: '',
            role_id: 0,
            register: '',
            freeze: false,
          },
          accessToken: '',
          isUserLoggedInBefore: false,
          userInfoInitialized: false,
        });
      },

      // 判断用户是否已登录方法的实现
      isLoggedIn: () => {
        // 如果用户角色 ID 不为 0，则认为已登录
        return get().userInfo.role_id !== 0;
      },

      // 判断用户是否是管理员方法的实现
      isAdmin: () => {
        // 如果用户角色 ID 为 2，则认为是管理员
        return get().userInfo.role_id === 2;
      },
    }),
    {
      // 持久化存储的 key，用于在存储中标识该状态
      name: 'user-storage',
      // 只持久化部分状态，包括 isUserLoggedInBefore、accessToken 和 userInfo
      partialize: (state) => ({
        isUserLoggedInBefore: state.isUserLoggedInBefore,
        accessToken: state.accessToken,
        userInfo: state.userInfo,
      }),
    }
  )
);

// 导出用户状态管理 store
export default useUserStore;