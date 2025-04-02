package service

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"server/global"
	"server/utils"
	"time"
)

// BaseService 结构体用于封装基础服务的方法
type BaseService struct {
}

// SendEmailVerificationCode 方法用于向指定邮箱发送邮箱验证码
// 参数 c 是 Gin 框架的上下文对象，包含了请求和响应的相关信息
// 参数 to 是要发送验证码的目标邮箱地址
func (baseService *BaseService) SendEmailVerificationCode(c *gin.Context, to string) error {
	// 调用 utils 包中的 GenerateVerificationCode 函数生成一个 6 位的验证码
	verificationCode := utils.GenerateVerificationCode(6)
	// 计算验证码的过期时间，当前时间加上 5 分钟
	expireTime := time.Now().Add(5 * time.Minute).Unix()

	// 获取当前请求的会话对象
	session := sessions.Default(c)
	// 将生成的验证码存入会话中，键名为 "verification_code"
	session.Set("verification_code", verificationCode)
	// 将目标邮箱地址存入会话中，键名为 "email"
	session.Set("email", to)
	// 将验证码的过期时间存入会话中，键名为 "expire_time"
	session.Set("expire_time", expireTime)
	// 将会话数据保存
	_ = session.Save()

	// 定义邮件的主题
	subject := "您的邮箱验证码"
	// 定义邮件的正文内容，包含验证码、过期提示等信息
	body := `亲爱的用户[` + to + `]，<br/>
<br/>
感谢您注册` + global.Config.Website.Name + `的个人博客！为了确保您的邮箱安全，请使用以下验证码进行验证：<br/>
<br/>
验证码：[<font color="blue"><u>` + verificationCode + `</u></font>]<br/>
该验证码在 5 分钟内有效，请尽快使用。<br/>
<br/>
如果您没有请求此验证码，请忽略此邮件。
<br/>
如有任何疑问，请联系我们的支持团队：<br/>
邮箱：` + global.Config.Email.From + `<br/>
<br/>
祝好，<br/>` +
		global.Config.Website.Title + `<br/>
<br/>`

	// 调用 utils 包中的 Email 函数发送邮件，传入目标邮箱、主题和正文内容
	_ = utils.Email(to, subject, body)

	// 返回 nil 表示发送邮件过程中没有出现错误
	return nil
}
