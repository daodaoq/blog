package utils

import (
	"context"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"go.uber.org/zap"
	"server/global"
	"server/model/other"
	"time"
)

// MySQLPagination 实现 MySQL 数据分页查询
func MySQLPagination[T any](model *T, option other.MySQLOption) (list []T, total int64, err error) {
	// 设置分页默认值
	if option.Page < 1 {
		option.Page = 1
	}
	if option.PageSize < 1 {
		option.PageSize = 10
	}
	if option.Order == "" {
		option.Order = "id desc"
	}

	// 使用独立事务避免长事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 优化count查询 - 只查询必要字段
	start := time.Now()
	query := tx.Model(model).Select("count(*)")
	if option.Where != nil {
		query = query.Where(option.Where)
	}
	if err = query.Count(&total).Error; err != nil {
		tx.Rollback()
		global.Log.Error("COUNT query failed",
			zap.Error(err),
			zap.String("query", query.Statement.SQL.String()))
		return nil, 0, err
	}
	if time.Since(start) > 200*time.Millisecond {
		global.Log.Warn("Slow COUNT query",
			zap.Duration("duration", time.Since(start)),
			zap.String("query", query.Statement.SQL.String()))
	}

	// 主查询
	start = time.Now()
	query = tx.Model(model)
	if option.Where != nil {
		query = query.Where(option.Where)
	}
	for _, preload := range option.Preload {
		query = query.Preload(preload)
	}

	err = query.Order(option.Order).
		Limit(option.PageSize).
		Offset((option.Page - 1) * option.PageSize).
		Find(&list).Error

	if time.Since(start) > 200*time.Millisecond {
		global.Log.Warn("Slow DATA query",
			zap.Duration("duration", time.Since(start)),
			zap.String("query", query.Statement.SQL.String()))
	}

	if err != nil {
		tx.Rollback()
		global.Log.Error("DATA query failed",
			zap.Error(err),
			zap.String("query", query.Statement.SQL.String()))
		return nil, 0, err
	}

	tx.Commit()
	return list, total, nil
}

// EsPagination 实现 Elasticsearch 数据分页查询
func EsPagination(ctx context.Context, option other.EsOption) (list []types.Hit, total int64, err error) {
	// 设置分页的默认值
	if option.Page < 1 {
		option.Page = 1 // 页码不能小于1，默认为1
	}
	if option.PageSize < 1 {
		option.PageSize = 10 // 每页记录数不能小于1，默认为10
	}

	// 设置 Elasticsearch 查询的分页值
	from := (option.Page - 1) * option.PageSize // 计算从哪一条记录开始
	option.Request.Size = &option.PageSize      // 设置每页的记录数
	option.Request.From = &from                 // 设置起始记录位置

	// 执行 Elasticsearch 搜索查询
	res, err := global.ESClient.Search().
		Index(option.Index).                       // 指定索引
		Request(option.Request).                   // 应用查询请求
		SourceIncludes_(option.SourceIncludes...). // 设置需要包含的字段
		Do(ctx)                                    // 执行查询
	if err != nil {
		return nil, 0, err // 如果查询失败，返回错误
	}

	// 提取查询结果
	list = res.Hits.Hits         // 获取查询结果中的文档
	total = res.Hits.Total.Value // 获取符合条件的文档总数
	return list, total, nil      // 返回查询结果和总文档数
}
