package main

import (
	"fmt"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

// Book 书籍结构体
type Book struct {
	ID     int     `db:"id"`
	Title  string  `db:"title"`
	Author string  `db:"author"`
	Price  float64 `db:"price"`
}

func main() {
	/*
	   函数功能实现：使用sqlx连接数据库并操作books表
	   流程：
	   1. 定义数据库连接环境变量
	   2. 检查数据库是否存在,不存在则创建,然后连接数据库
	   3. 创建books表
	   4. 插入示例数据
	   5. 执行复杂查询：查询价格大于50元的书籍
	   6. 类型安全的结果映射

	*/
	// 1.批量定义数据库连接环境变量
	var (
		DB_USER     = "root"
		DB_PASSWORD = "root123456"
		DB_HOST     = "127.0.0.1"
		DB_PORT     = 3306
		DB_NAME     = "go_sqlx"
	)

	// 2.检查数据库是否存在,不存在则创建,然后连接数据库
	fmt.Println("====== 检查数据库是否存在并连接 ======")
	db, err := databaseConnectOptions(DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
	if err != nil {
		fmt.Printf("====== 数据库操作失败: %v ======\n", err)
		return
	}
	defer db.Close()
	fmt.Printf("====== 成功连接到数据库 '%s' ======\n", DB_NAME)
	fmt.Println()

	// 3.创建books表
	// fmt.Println("====== 创建books表 ======")
	// err = createBooksTable(db)
	// if err != nil {
	// 	fmt.Printf("创建books表失败: %v\n", err)
	// 	return
	// }
	// fmt.Printf("====== books表创建成功 ======\n")
	// fmt.Println()

	// 4.插入示例数据
	// fmt.Println("====== 插入示例书籍数据 ======")
	// err = insertSampleBooks(db)
	// if err != nil {
	// 	fmt.Printf("插入书籍数据失败: %v\n", err)
	// 	return
	// }
	// fmt.Printf("====== 示例书籍数据插入成功 ======\n")
	// fmt.Println()

	// 5.执行复杂查询：查询价格大于50元的书籍
	fmt.Println("====== 查询价格大于50元的书籍 ======")
	expensiveBooks, err := getBooksByPriceGreaterThan(db, 50.0)
	if err != nil {
		fmt.Printf("查询书籍失败: %v\n", err)
		return
	}

	fmt.Printf("找到 %d 本价格大于50元的书籍:\n", len(expensiveBooks))
	fmt.Printf("查询价格大于50元的书籍信息: %v\n", expensiveBooks)
	// for _, book := range expensiveBooks {
	// 	fmt.Printf("ID: %d, 书名: %s, 作者: %s, 价格: %.2f元\n",
	// 		book.ID, book.Title, book.Author, book.Price)
	// }
	fmt.Println()

	// 6.额外查询：按作者查询书籍(安全类型映射)
	fmt.Println("====== 按作者查询书籍（鲁迅） ======")
	luXunBooks, err := getBooksByAuthor(db, "鲁迅")
	if err != nil {
		fmt.Printf("按作者查询失败: %v\n", err)
		return
	}

	fmt.Printf("找到 %d 本鲁迅的书籍:\n", len(luXunBooks))
	for _, book := range luXunBooks {
		fmt.Printf("ID: %d, 书名: %s, 作者: %s, 价格: %.2f元\n",
			book.ID, book.Title, book.Author, book.Price)
	}
	fmt.Println()

}

// 0.检查数据库是否存在,不存在则创建,然后连接到数据库
func databaseConnectOptions(dbName, user, password, host string, port int) (*sqlx.DB, error) {
	/*
	   传入参数：数据库名、用户名、密码、地址、端口
	   返回值：数据库连接对象、错误信息
	   功能：检查数据库是否存在,不存在则创建,然后连接到数据库
	   流程：
	   1. 连接到MySQL服务器(不指定数据库)
	   2. 检查数据库是否存在
	   3. 如果数据库不存在,则创建
	   4. 连接到指定数据库
	   5. 返回数据库连接对象
	*/
	// 先连接到MySQL服务器(不指定数据库)
	serverDSN := fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=True&loc=Local",
		user, password, host, port)

	serverDB, err := sqlx.Connect("mysql", serverDSN)
	if err != nil {
		return nil, fmt.Errorf("连接到MySQL服务器失败: %v", err)
	}
	defer serverDB.Close()

	// 设置连接池参数
	serverDB.SetMaxOpenConns(5)
	serverDB.SetMaxIdleConns(2)

	// 检查数据库是否存在
	var count int64
	query := `SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`
	err = serverDB.Get(&count, query, dbName)
	if err != nil {
		return nil, fmt.Errorf("检查数据库是否存在失败: %v", err)
	}

	// 如果数据库不存在,则创建
	if count == 0 {
		createSQL := fmt.Sprintf("CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)
		_, err = serverDB.Exec(createSQL)
		if err != nil {
			return nil, fmt.Errorf("创建数据库失败: %v", err)
		}
		fmt.Printf("====== 数据库 '%s' 创建成功 ======\n", dbName)
	} else {
		fmt.Printf("====== 数据库 '%s' 已存在 ======\n", dbName)
	}

	// 连接到指定数据库
	dbDSN := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		user, password, host, port, dbName)

	db, err := sqlx.Connect("mysql", dbDSN)
	if err != nil {
		return nil, fmt.Errorf("连接数据库失败: %v", err)
	}

	// 设置连接池参数
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	return db, nil
}

// 1.创建books表
func createBooksTable(db *sqlx.DB) error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS books (
		id INT AUTO_INCREMENT PRIMARY KEY,
		title VARCHAR(200) NOT NULL COMMENT '书名',
		author VARCHAR(100) NOT NULL COMMENT '作者',
		price DECIMAL(10,2) NOT NULL COMMENT '价格'
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

	_, err := db.Exec(createTableSQL)
	return err
}

// 2.插入示例书籍数据
func insertSampleBooks(db *sqlx.DB) error {
	books := []Book{
		{Title: "红楼梦", Author: "曹雪芹", Price: 45.50},
		{Title: "西游记", Author: "吴承恩", Price: 38.80},
		{Title: "水浒传", Author: "施耐庵", Price: 42.00},
		{Title: "三国演义", Author: "罗贯中", Price: 48.90},
		{Title: "呐喊", Author: "鲁迅", Price: 25.60},
		{Title: "彷徨", Author: "鲁迅", Price: 28.30},
		{Title: "朝花夕拾", Author: "鲁迅", Price: 22.80},
		{Title: "活着", Author: "余华", Price: 35.00},
		{Title: "平凡的世界", Author: "路遥", Price: 68.50},
		{Title: "百年孤独", Author: "加西亚·马尔克斯", Price: 55.20},
		{Title: "1984", Author: "乔治·奥威尔", Price: 42.80},
		{Title: "动物农场", Author: "乔治·奥威尔", Price: 28.90},
		{Title: "人类简史", Author: "尤瓦尔·赫拉利", Price: 78.00},
		{Title: "未来简史", Author: "尤瓦尔·赫拉利", Price: 85.50},
		{Title: "时间简史", Author: "史蒂芬·霍金", Price: 65.80},
	}

	insertSQL := `INSERT INTO books (title, author, price) VALUES (?, ?, ?)`
	for _, book := range books {
		_, err := db.Exec(insertSQL, book.Title, book.Author, book.Price)
		if err != nil {
			return err
		}
	}
	return nil
}

// 3.查询价格大于指定金额的书籍（复杂查询）
func getBooksByPriceGreaterThan(db *sqlx.DB, minPrice float64) ([]Book, error) {
	var books []Book
	query := `
		SELECT id, title, author, price 
		FROM books 
		WHERE price > ? 
		ORDER BY price DESC, title ASC`

	err := db.Select(&books, query, minPrice)
	return books, err
}

// 4.按作者查询书籍(安全类型映射)
func getBooksByAuthor(db *sqlx.DB, author string) ([]Book, error) {
	var books []Book
	query := `
		SELECT id, title, author, price 
		FROM books 
		WHERE author = ? 
		ORDER BY title ASC`

	err := db.Select(&books, query, author)
	return books, err
}
