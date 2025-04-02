package router

import (
	"github.com/gin-gonic/gin"
	"server/api"
	"server/middleware"
)

// UserRouter 结构体用于管理用户相关的路由
type UserRouter struct {
}

// InitUserRouter 方法用于初始化用户相关的路由
// Router 是一个受保护的路由组，通常需要用户认证
// PublicRouter 是一个公共路由组，不需要用户认证
// AdminRouter 是一个管理员路由组，只有管理员用户可以访问
func (u *UserRouter) InitUserRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup, AdminRouter *gin.RouterGroup) {
	// 创建一个名为 "user" 的子路由组，属于受保护的路由组
	userRouter := Router.Group("user")
	// 创建一个名为 "user" 的子路由组，属于公共路由组
	userPublicRouter := PublicRouter.Group("user")
	// 创建一个名为 "user" 的子路由组，属于公共路由组，并使用 LoginRecord 中间件
	userLoginRouter := PublicRouter.Group("user").Use(middleware.LoginRecord())
	// 创建一个名为 "user" 的子路由组，属于管理员路由组
	userAdminRouter := AdminRouter.Group("user")

	// 获取 UserApi 实例，用于处理用户相关的 API 请求
	userApi := api.ApiGroupApp.UserApi

	// 定义受保护的用户路由
	{
		// 处理用户注销请求
		userRouter.POST("logout", userApi.Logout)
		// 处理用户重置密码请求
		userRouter.PUT("resetPassword", userApi.UserResetPassword)
		// 处理获取用户信息请求
		userRouter.GET("info", userApi.UserInfo)
		// 处理用户修改信息请求
		userRouter.PUT("changeInfo", userApi.UserChangeInfo)
		// 处理获取用户天气信息请求
		userRouter.GET("weather", userApi.UserWeather)
		// 处理获取用户图表信息请求
		userRouter.GET("chart", userApi.UserChart)
	}

	// 定义公共用户路由
	{
		// 处理用户忘记密码请求
		userPublicRouter.POST("forgotPassword", userApi.ForgotPassword)
		// 处理获取用户卡片信息请求
		userPublicRouter.GET("card", userApi.UserCard)
	}

	// 定义使用 LoginRecord 中间件的公共用户路由
	{
		// 处理用户注册请求
		userLoginRouter.POST("register", userApi.Register)
		// 处理用户登录请求
		userLoginRouter.POST("login", userApi.Login)
	}

	// 定义管理员用户路由
	{
		// 处理获取用户列表请求
		userAdminRouter.GET("list", userApi.UserList)
		// 处理冻结用户请求
		userAdminRouter.PUT("freeze", userApi.UserFreeze)
		// 处理解冻用户请求
		userAdminRouter.PUT("unfreeze", userApi.UserUnfreeze)
		// 处理获取用户登录列表请求
		userAdminRouter.GET("loginList", userApi.UserLoginList)
	}
}
