package service

import (
	"context"
	"errors"
	"github.com/elastic/go-elasticsearch/v8/typedapi/core/search"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types/enums/scriptlanguage"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types/enums/sortorder"
	"gorm.io/gorm"
	"server/global"
	"server/model/appTypes"
	"server/model/database"
	"server/model/elasticsearch"
	"server/model/other"
	"server/model/request"
	"server/utils"
	"strconv"
	"time"
)

type ArticleService struct {
}

func (articleService *ArticleService) ArticleInfoByID(id string) (elasticsearch.Article, error) {
	// 异步更新浏览量
	go func() {
		articleView := articleService.NewArticleView()
		_ = articleView.Set(id)
	}()
	return articleService.Get(id)
}

// ArticleSearch 该函数用于根据传入的查询条件在 Elasticsearch 中搜索文章信息，并返回搜索结果、结果总数和可能出现的错误
func (articleService *ArticleService) ArticleSearch(info request.ArticleSearch) (interface{}, int64, error) {
	// 创建一个 Elasticsearch 搜索请求对象
	req := &search.Request{
		Query: &types.Query{},
	}

	// 创建一个 Bool 查询对象，用于组合多个查询条件
	boolQuery := &types.BoolQuery{}

	// 根据查询字段查询
	// 如果传入的查询字符串不为空，则构建 Should 子查询，用于匹配文章的标题、关键词、摘要和内容
	if info.Query != "" {
		boolQuery.Should = []types.Query{
			// 匹配文章标题
			{Match: map[string]types.MatchQuery{"title": {Query: info.Query}}},
			// 匹配文章关键词
			{Match: map[string]types.MatchQuery{"keyword": {Query: info.Query}}},
			// 匹配文章摘要
			{Match: map[string]types.MatchQuery{"abstract": {Query: info.Query}}},
			// 匹配文章内容
			{Match: map[string]types.MatchQuery{"content": {Query: info.Query}}},
		}
	}

	// 根据标签筛选
	// 如果传入的标签不为空，则构建 Must 子查询，用于精确匹配文章的标签
	if info.Tag != "" {
		boolQuery.Must = []types.Query{
			{Match: map[string]types.MatchQuery{"tags": {Query: info.Tag}}},
		}
	}

	// 根据类别筛选
	// 如果传入的类别不为空，则构建 Filter 子查询，用于精确匹配文章的类别
	if info.Category != "" {
		boolQuery.Filter = []types.Query{
			{Term: map[string]types.TermQuery{"category": {Value: info.Category}}},
		}
	}

	// 如果有查询条件，则使用 Bool 查询，否则使用 MatchAll 查询
	// 如果 Bool 查询的 Should、Must 或 Filter 子查询不为空，则将 Bool 查询设置到请求中
	if boolQuery.Should != nil || boolQuery.Must != nil || boolQuery.Filter != nil {
		req.Query.Bool = boolQuery
	} else {
		// 若没有查询条件，则使用 MatchAll 查询，即返回所有文章
		req.Query.MatchAll = &types.MatchAllQuery{}
	}

	// 设置排序字段
	// 如果传入了排序字段，则根据传入的排序规则设置排序方式
	if info.Sort != "" {
		var sortField string
		// 根据传入的排序类型，映射到实际的 Elasticsearch 字段
		switch info.Sort {
		case "time":
			sortField = "created_at"
		case "view":
			sortField = "views"
		case "comment":
			sortField = "comments"
		case "like":
			sortField = "likes"
		default:
			// 如果传入的排序类型不匹配，则默认按创建时间排序
			sortField = "created_at"
		}

		var order sortorder.SortOrder
		// 根据传入的排序顺序，设置升序或降序
		if info.Order != "asc" {
			order = sortorder.Desc
		} else {
			order = sortorder.Asc
		}

		// 设置排序规则到请求中
		req.Sort = []types.SortCombinations{
			types.SortOptions{
				SortOptions: map[string]types.FieldSort{
					sortField: {Order: &order},
				},
			},
		}
	}

	// 构建 Elasticsearch 查询选项
	option := other.EsOption{
		PageInfo:       info.PageInfo,                                                                                          // 分页信息
		Index:          elasticsearch.ArticleIndex(),                                                                           // 要查询的 Elasticsearch 索引
		Request:        req,                                                                                                    // Elasticsearch 请求对象
		SourceIncludes: []string{"created_at", "cover", "title", "abstract", "category", "tags", "views", "comments", "likes"}, // 要返回的字段
	}
	// 调用工具函数进行 Elasticsearch 分页查询，并返回结果
	return utils.EsPagination(context.TODO(), option)
}

func (articleService *ArticleService) ArticleCategory() ([]database.ArticleCategory, error) {
	var category []database.ArticleCategory
	if err := global.DB.Find(&category).Error; err != nil {
		return nil, err
	}
	return category, nil
}

func (articleService *ArticleService) ArticleTags() ([]database.ArticleTag, error) {
	var tags []database.ArticleTag
	if err := global.DB.Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

func (articleService *ArticleService) ArticleLike(req request.ArticleLike) error {
	return global.DB.Transaction(func(tx *gorm.DB) error {
		var al database.ArticleLike
		var num int

		// 如果用户未收藏，则创建收藏记录
		if errors.Is(tx.Where("user_id = ? AND article_id = ?", req.UserID, req.ArticleID).First(&al).Error, gorm.ErrRecordNotFound) {
			if err := tx.Create(&database.ArticleLike{UserID: req.UserID, ArticleID: req.ArticleID}).Error; err != nil {
				return err
			}
			num = 1
		} else { // 如果用户已经收藏，则取消收藏
			if err := tx.Delete(&al).Error; err != nil {
				return err
			}
			num = -1
		}

		// 更新文章收藏数
		source := "ctx._source.likes += " + strconv.Itoa(num)
		script := types.Script{Source: &source, Lang: &scriptlanguage.Painless}
		_, err := global.ESClient.Update(elasticsearch.ArticleIndex(), req.ArticleID).Script(&script).Do(context.TODO())
		return err
	})
}

func (articleService *ArticleService) ArticleIsLike(req request.ArticleLike) (bool, error) {
	return !errors.Is(global.DB.Where("user_id = ? AND article_id = ?", req.UserID, req.ArticleID).First(&database.ArticleLike{}).Error, gorm.ErrRecordNotFound), nil
}

func (articleService *ArticleService) ArticleLikesList(info request.ArticleLikesList) (interface{}, int64, error) {
	db := global.DB.Where("user_id = ?", info.UserID)
	option := other.MySQLOption{
		PageInfo: info.PageInfo,
		Where:    db,
	}

	l, total, err := utils.MySQLPagination(&database.ArticleLike{}, option)
	if err != nil {
		return nil, 0, err
	}
	var list []struct {
		Id_     string                `json:"_id"`
		Source_ elasticsearch.Article `json:"_source"`
	}

	for _, articleLike := range l {
		article, err := articleService.Get(articleLike.ArticleID)
		if err != nil {
			return nil, 0, err
		}
		article.UpdatedAt = ""
		article.Keyword = ""
		article.Content = ""
		list = append(list, struct {
			Id_     string                `json:"_id"`
			Source_ elasticsearch.Article `json:"_source"`
		}{
			Id_:     articleLike.ArticleID,
			Source_: article,
		})
	}
	return list, total, nil
}

func (articleService *ArticleService) ArticleCreate(req request.ArticleCreate) error {
	b, err := articleService.Exits(req.Title)
	if err != nil {
		return err
	}
	if b {
		return errors.New("the article already exists")
	}
	now := time.Now().Format("2006-01-02 15:04:05")
	articleToCreate := elasticsearch.Article{
		CreatedAt: now,
		UpdatedAt: now,
		Cover:     req.Cover,
		Title:     req.Title,
		Keyword:   req.Title,
		Category:  req.Category,
		Tags:      req.Tags,
		Abstract:  req.Abstract,
		Content:   req.Content,
	}
	return global.DB.Transaction(func(tx *gorm.DB) error {
		// 同时更新文章类别表中的数据
		if err := articleService.UpdateCategoryCount(tx, "", articleToCreate.Category); err != nil {
			return err
		}

		// 同时更新文章标签表中的数据
		if err := articleService.UpdateTagsCount(tx, []string{}, articleToCreate.Tags); err != nil {
			return err
		}

		// 同时更新图片表中的图片类别
		if err := utils.ChangeImagesCategory(tx, []string{articleToCreate.Cover}, appTypes.Cover); err != nil {
			return err
		}
		illustrations, err := utils.FindIllustrations(articleToCreate.Content)
		if err != nil {
			return err
		}
		if err := utils.ChangeImagesCategory(tx, illustrations, appTypes.Illustration); err != nil {
			return err
		}

		return articleService.Create(&articleToCreate)
	})
}

func (articleService *ArticleService) ArticleDelete(req request.ArticleDelete) error {
	if len(req.IDs) == 0 {
		return nil
	}
	return global.DB.Transaction(func(tx *gorm.DB) error {
		commentService := new(CommentService)
		for _, id := range req.IDs {
			articleToDelete, err := articleService.Get(id)
			if err != nil {
				return err
			}
			// 同时更新文章类别表中的数据
			if err := articleService.UpdateCategoryCount(tx, articleToDelete.Category, ""); err != nil {
				return err
			}
			// 同时更新文章标签表中的数据
			if err := articleService.UpdateTagsCount(tx, articleToDelete.Tags, []string{}); err != nil {
				return err
			}
			// 同时更新图片表中的图片类别
			if err := utils.InitImagesCategory(tx, []string{articleToDelete.Cover}); err != nil {
				return err
			}
			illustrations, err := utils.FindIllustrations(articleToDelete.Content)
			if err != nil {
				return err
			}
			if err := utils.InitImagesCategory(tx, illustrations); err != nil {
				return err
			}
			// 同时删除该文章下的所有评论
			comments, err := commentService.CommentInfoByArticleID(request.CommentInfoByArticleID{ArticleID: id})
			if err != nil {
				return err
			}
			// 同时删除该文章下的所有评论
			// comments, err := ServiceGroupApp.CommentService.CommentInfoByArticleID(request.CommentInfoByArticleID{ArticleID: id})
			// if err != nil {
			// 	return err
			// }
			for _, comment := range comments {
				if err := ServiceGroupApp.CommentService.DeleteCommentAndChildren(tx, comment.ID); err != nil {
					return err
				}
			}
		}

		return articleService.Delete(req.IDs)
	})
}

func (articleService *ArticleService) ArticleUpdate(req request.ArticleUpdate) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	articleToUpdate := struct {
		UpdatedAt string   `json:"updated_at"`
		Cover     string   `json:"cover"`
		Title     string   `json:"title"`
		Keyword   string   `json:"keyword"`
		Category  string   `json:"category"`
		Tags      []string `json:"tags"`
		Abstract  string   `json:"abstract"`
		Content   string   `json:"content"`
	}{
		UpdatedAt: now,
		Cover:     req.Cover,
		Title:     req.Title,
		Keyword:   req.Title,
		Category:  req.Category,
		Tags:      req.Tags,
		Abstract:  req.Abstract,
		Content:   req.Content,
	}
	return global.DB.Transaction(func(tx *gorm.DB) error {
		oldArticle, err := articleService.Get(req.ID)
		if err != nil {
			return err
		}

		// 同时更新文章类别表中的数据
		if err := articleService.UpdateCategoryCount(tx, oldArticle.Category, articleToUpdate.Category); err != nil {
			return err
		}

		// 同时更新文章标签表中的数据
		if err := articleService.UpdateTagsCount(tx, oldArticle.Tags, articleToUpdate.Tags); err != nil {
			return err
		}

		// 同时更新图片表中的图片类别
		if articleToUpdate.Cover != oldArticle.Cover {
			if err := utils.InitImagesCategory(tx, []string{oldArticle.Cover}); err != nil {
				return err
			}
			if err := utils.ChangeImagesCategory(tx, []string{articleToUpdate.Cover}, appTypes.Cover); err != nil {
				return err
			}
		}
		oldIllustrations, err := utils.FindIllustrations(oldArticle.Content)
		if err != nil {
			return err
		}
		newIllustrations, err := utils.FindIllustrations(articleToUpdate.Content)
		if err != nil {
			return err
		}
		addedIllustrations, removedIllustrations := utils.DiffArrays(oldIllustrations, newIllustrations)
		if err := utils.InitImagesCategory(tx, removedIllustrations); err != nil {
			return err
		}
		if err := utils.ChangeImagesCategory(tx, addedIllustrations, appTypes.Illustration); err != nil {
			return err
		}

		return articleService.Update(req.ID, articleToUpdate)
	})
}

func (articleService *ArticleService) ArticleList(info request.ArticleList) (list interface{}, total int64, err error) {
	req := &search.Request{
		Query: &types.Query{},
	}

	boolQuery := &types.BoolQuery{}

	// 根据标题查询
	if info.Title != nil {
		boolQuery.Must = append(boolQuery.Must, types.Query{Match: map[string]types.MatchQuery{"title": {Query: *info.Title}}})
	}

	// 根据简介查询
	if info.Abstract != nil {
		boolQuery.Must = append(boolQuery.Must, types.Query{Match: map[string]types.MatchQuery{"abstract": {Query: *info.Abstract}}})
	}

	// 根据类别筛选
	if info.Category != nil {
		boolQuery.Filter = []types.Query{
			{
				Term: map[string]types.TermQuery{
					"category": {Value: info.Category},
				},
			},
		}
	}

	// 根据条件执行查询
	if boolQuery.Must != nil || boolQuery.Filter != nil {
		req.Query.Bool = boolQuery
	} else {
		req.Query.MatchAll = &types.MatchAllQuery{}
		req.Sort = []types.SortCombinations{
			types.SortOptions{
				SortOptions: map[string]types.FieldSort{
					"created_at": {Order: &sortorder.Desc},
				},
			},
		}
	}

	option := other.EsOption{
		PageInfo: info.PageInfo,
		Index:    elasticsearch.ArticleIndex(),
		Request:  req,
	}
	return utils.EsPagination(context.TODO(), option)
}
