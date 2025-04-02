package flag

import (
	"errors"
	"fmt"
	"github.com/urfave/cli"
	"go.uber.org/zap"
	"os"
	"server/global"
)

// 定义 CLI 标志，用于不同操作的命令行选项
var (
	// 用于初始化 MySQL 数据库表结构的布尔标志
	// Usage 字段主要用于描述该标志的用途和功能
	sqlFlag = &cli.BoolFlag{
		Name:  "sql",
		Usage: "Initializes the srtucture of the MySQL database table.",
	}
	// 用于将 SQL 数据导出到指定文件的布尔标志
	sqlExportFlag = &cli.BoolFlag{
		Name:  "sql-export",
		Usage: "Exports SQL data to a specified file.",
	}
	// 用于从指定文件导入 SQL 数据的字符串标志，值为文件路径
	sqlImportFlag = &cli.StringFlag{
		Name:  "sql-import",
		Usage: "Imports SQL data from a specified file.",
	}
	// 用于初始化 Elasticsearch 索引的布尔标志
	esFlag = &cli.BoolFlag{
		Name:  "es",
		Usage: "Initializes the Elasticsearch index.",
	}
	// 用于将 Elasticsearch 数据导出到指定文件的布尔标志
	esExportFlag = &cli.BoolFlag{
		Name:  "es-export",
		Usage: "Exports data from Elasticsearch to a specified file.",
	}
	// 用于从指定文件导入数据到 Elasticsearch 的字符串标志，值为文件路径
	esImportFlag = &cli.StringFlag{
		Name:  "es-import",
		Usage: "Imports data into Elasticsearch from a specified file.",
	}
	// 用于根据 config.yaml 文件中指定的名称、电子邮件和地址创建管理员的布尔标志
	adminFlag = &cli.BoolFlag{
		Name:  "admin",
		Usage: "Creates an administrator using the name, email and address specified in the config.yaml file.",
	}
)

// Run 执行基于命令行标志的相应操作
// 它处理不同的标志，执行相应操作，并记录成功或错误的消息
func Run(c *cli.Context) {
	// 检查是否设置了多个标志
	if c.NumFlags() > 1 {
		// 如果设置了多个标志，创建一个退出错误，提示只能指定一个命令
		err := cli.NewExitError("Only one command can be specified", 1)
		// 记录错误日志
		global.Log.Error("Invalid command usage:", zap.Error(err))
		// 以错误码 1 退出程序
		os.Exit(1)
	}

	// 根据不同的标志选择执行的操作
	switch {
	case c.Bool(sqlFlag.Name):
		// 如果 sql 标志被设置，执行 SQL 相关操作
		if err := SQL(); err != nil {
			// 如果操作失败，记录错误日志
			global.Log.Error("Failed to create table structure:", zap.Error(err))
			return
		} else {
			// 如果操作成功，记录成功日志
			global.Log.Info("Successfully created table structure")
		}
	case c.Bool(sqlExportFlag.Name):
		// 如果 sql-export 标志被设置，执行 SQL 数据导出操作
		if err := SQLExport(); err != nil {
			// 如果操作失败，记录错误日志
			global.Log.Error("Failed to export SQL data:", zap.Error(err))
		} else {
			// 如果操作成功，记录成功日志
			global.Log.Info("Successfully exported SQL data")
		}
	case c.IsSet(sqlImportFlag.Name):
		// 如果 sql-import 标志被设置，执行 SQL 数据导入操作
		if errs := SQLImport(c.String(sqlImportFlag.Name)); len(errs) > 0 {
			// 如果操作失败，将多个错误合并为一个字符串
			var combinedErrors string
			for _, err := range errs {
				combinedErrors += err.Error() + "\n"
			}
			err := errors.New(combinedErrors)
			// 记录错误日志
			global.Log.Error("Failed to import SQL data:", zap.Error(err))
		} else {
			// 如果操作成功，记录成功日志
			global.Log.Info("Successfully imported SQL data")
		}
	case c.Bool(esFlag.Name):
		// 如果 es 标志被设置，执行 Elasticsearch 相关操作
		if err := Elasticsearch(); err != nil {
			// 如果操作失败，记录错误日志
			global.Log.Error("Failed to create ES indices:", zap.Error(err))
		} else {
			// 如果操作成功，记录成功日志
			global.Log.Info("Successfully created ES indices")
		}
	case c.Bool(esExportFlag.Name):
		// 如果 es-export 标志被设置，执行 Elasticsearch 数据导出操作
		if err := ElasticsearchExport(); err != nil {
			// 如果操作失败，记录错误日志
			global.Log.Error("Failed to export ES data:", zap.Error(err))
		} else {
			// 如果操作成功，记录成功日志
			global.Log.Info("Successfully exported ES data")
		}
	case c.IsSet(esImportFlag.Name):
		// 如果 es-import 标志被设置，执行 Elasticsearch 数据导入操作
		if num, err := ElasticsearchImport(c.String(esImportFlag.Name)); err != nil {
			// 如果操作失败，记录错误日志
			global.Log.Error("Failed to import ES data:", zap.Error(err))
		} else {
			// 如果操作成功，记录成功日志并显示导入的记录数量
			global.Log.Info(fmt.Sprintf("Successfully imported ES data, totaling %d records", num))
		}
	case c.Bool(adminFlag.Name):
		// 如果 admin 标志被设置，执行创建管理员的操作
		if err := Admin(); err != nil {
			// 如果操作失败，记录错误日志
			global.Log.Error("Failed to create an administrator:", zap.Error(err))
		} else {
			// 如果操作成功，记录成功日志
			global.Log.Info("Successfully created an administrator")
		}
	default:
		// 如果没有设置有效的标志，创建一个退出错误，提示未知命令
		err := cli.NewExitError("unknown command", 1)
		// 记录错误日志
		global.Log.Error(err.Error(), zap.Error(err))
	}
}

// NewApp 创建并配置一个新的 CLI 应用程序，设置标志和默认操作
func NewApp() *cli.App {
	// 创建一个新的 CLI 应用实例
	app := cli.NewApp()
	// 设置应用程序的名称
	app.Name = "Go Blog"
	// 设置应用程序支持的标志列表
	app.Flags = []cli.Flag{
		sqlFlag,
		sqlExportFlag,
		sqlImportFlag,
		esFlag,
		esExportFlag,
		esImportFlag,
		adminFlag,
	}
	// 设置应用程序的默认操作，即当没有指定具体子命令时执行的操作
	app.Action = Run
	// 返回配置好的应用程序实例
	return app
}

// InitFlag 初始化并运行 CLI 应用程序
func InitFlag() {
	// 检查命令行参数的数量是否大于 1（即是否有输入参数）
	if len(os.Args) > 1 {
		// 创建一个新的 CLI 应用程序
		app := NewApp()
		// 运行应用程序，传入命令行参数
		err := app.Run(os.Args)
		if err != nil {
			// 如果应用程序执行过程中出错，记录错误日志
			global.Log.Error("Application execution encountered an error:", zap.Error(err))
			// 以错误码 1 退出程序
			os.Exit(1)
		}
		// 检查第一个命令行参数是否为 -h 或 -help
		if os.Args[1] == "-h" || os.Args[1] == "-help" {
			// 如果是，打印提示信息
			fmt.Println("Displaying help message...")
		}
		// 正常退出程序
		os.Exit(0)
	}
}
