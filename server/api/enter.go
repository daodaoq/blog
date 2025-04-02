package api

import "server/service"

// ApiGroup 将所有 API 结构体统一管理，这样可以在路由注册时集中处理 API 组，避免代码零散，提高可维护性
type ApiGroup struct {
	BaseApi
	UserApi
	ImageApi
	ArticleApi
	CommentApi
	AdvertisementApi
	FriendLinkApi
	FeedbackApi
	WebsiteApi
	ConfigApi
}

var ApiGroupApp = new(ApiGroup)

// 方便直接调用服务层方法
var baseService = service.ServiceGroupApp.BaseService
var userService = service.ServiceGroupApp.UserService
var jwtService = service.ServiceGroupApp.JwtService
var qqService = service.ServiceGroupApp.QQService
var imageService = service.ServiceGroupApp.ImageService
var articleService = service.ServiceGroupApp.ArticleService
var commentService = service.ServiceGroupApp.CommentService
var advertisementService = service.ServiceGroupApp.AdvertisementService
var friendLinkService = service.ServiceGroupApp.FriendLinkService
var feedbackService = service.ServiceGroupApp.FeedbackService
var websiteService = service.ServiceGroupApp.WebsiteService
var configService = service.ServiceGroupApp.ConfigService
