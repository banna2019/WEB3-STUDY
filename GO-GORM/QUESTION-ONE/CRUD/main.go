package main

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Student struct {
	ID    int    `gorm:"Comment: 主键"`
	Name  string `gorm:"unique;not null;Comment: 姓名"`
	Age   int    `gorm:"Comment: 年龄"`
	Grade string `gorm:"Comment: 年级"`
}

func main() {
	// 1.批量定义数据库连接环境变量
	var (
		DB_USER     = "root"
		DB_PASSWORD = "root123456"
		DB_HOST     = "127.0.0.1"
		DB_PORT     = 3306
		DB_NAME     = "go_gorm"
	)

	// 2.先判断数据库是否存在,不存在则创建
	err := createDatabaseIfNotExists(DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
	if err != nil {
		panic(fmt.Sprintf("====== 创建数据库失败！: %v ======\n", err))
	}

	// 2.连接数据库
	db, err := connectToDatabase(DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
	if err != nil {
		panic(fmt.Sprintf("====== 连接数据库失败！: %v ======\n", err))
	}
	fmt.Printf("====== 成功连接到数据库 '%s' ======\n", DB_NAME)

	// 3.自动迁移表结构
	// db.AutoMigrate(&Student{})

	// 4.创建示例数据
	// fmt.Println("====== 创建模拟数据 ======")
	// // 创建姓名为"张三"、年龄为20、年级为"三年级"的单条数据
	// var stu = &Student{Name: "张三", Age: 20, Grade: "三年级"}
	// // 这里是创建多条伪数据,方便后面的查询操作
	// var stu1 = []Student{
	// 	{Name: "张三0", Age: 14, Grade: "二年级"},
	// 	{Name: "张三1", Age: 23, Grade: "八年级"},
	// 	{Name: "张三2", Age: 25, Grade: "七年级"},
	// 	{Name: "张三3", Age: 21, Grade: "五年级"},
	// 	{Name: "张三4", Age: 24, Grade: "六年级"},
	// 	{Name: "李四1", Age: 21, Grade: "九年级"},
	// 	{Name: "王五1", Age: 15, Grade: "六年级"},
	// 	{Name: "赵六1", Age: 18, Grade: "七年级"},
	// 	{Name: "王麻子1", Age: 11, Grade: "三年级"},
	// 	{Name: "孙七1", Age: 24, Grade: "七年级"},
	// }
	// db.Create(stu)
	// fmt.Printf("====== 创建单条数据成功！ %v ======\n", stu)
	// db.Create(stu1)
	// fmt.Printf("====== 创建多条数据成功！ %v ======\n", stu1)

	// // 5.查询所有年龄大于18岁的学生
	var stus []Student
	db.Where("Age > ?", 18).Find(&stus)
	fmt.Printf("查询所有年龄大于18岁的学生: %v\n", stus)
	fmt.Println()

	// 6.查找姓名为"张三"的学生,将年级更新为"四年级"
	fmt.Println("====== 更新张三的年级为四年级 ======")
	/* 更新前查询 */
	var stu2 = &Student{}
	db.Model(stu2).Where("Name = ?", "张三").Find(stu2)
	fmt.Printf("更新前'张三的数据信息': %v\n", stu2)
	/* 更新操作 */
	// var stu3 = &Student{}
	db.Model(stu2).Where("Name = ?", "张三").Update("Grade", "四年级")
	/* 更新后查询 */
	db.Model(stu2).Where("Name = ?", "张三").Find(stu2)
	fmt.Printf("更新后'张三的数据信息': %v\n", stu2)
	fmt.Println()

	// 7.查询年龄小于15岁的学生信息
	fmt.Println("====== 查询年龄小于15岁的学生信息 ======")
	var stu5 = []Student{}
	db.Model(&stu5).Where("Age < ?", 15).Find(&stu5)
	fmt.Printf("年龄小于15岁的学生有: %v\n", stu5)

}

// 检查数据库是否存在,不存在则创建
func createDatabaseIfNotExists(dbName, user, password, host string, port int) error {
	/*
	   // 传入参数：数据库名、用户名、密码、地址、端口
	   dbName: 数据库名
	   user: 用户名
	   password: 密码
	   host: 地址
	   port: 端口

	   返回值：错误信息

	   功能：检查数据库是否存在,不存在则创建

	   流程：
	   1. 连接到MySQL服务器(不指定数据库)
	   2. 检查数据库是否存在
	   3. 如果数据库不存在,则创建
	   4. 返回错误信息
	*/
	// 先连接到MySQL服务器(不指定数据库)
	db, err := connectToDatabase(user, password, host, port, "")
	if err != nil {
		return fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
	}

	// 检查数据库是否存在
	var count int64
	err = db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", dbName).Scan(&count).Error
	if err != nil {
		return fmt.Errorf("====== 检查数据库是否存在失败！: %v ======\n", err)
	}

	// 如果数据库不存在,则创建
	if count == 0 {
		err = db.Exec(fmt.Sprintf("CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)).Error
		if err != nil {
			return fmt.Errorf("====== 创建数据库失败！: %v ======\n", err)
		}
		fmt.Printf("====== 数据库 '%s' 创建成功 ======\n", dbName)
	} else {
		fmt.Printf("====== 数据库 '%s' 已存在 ======\n", dbName)
	}

	return nil
}

// 连接到数据库的统一方法
func connectToDatabase(user, password, host string, port int, dbName string) (*gorm.DB, error) {
	/*
	   传入参数：用户名、密码、地址、端口、数据库名(为空则不指定数据库)
	   返回值：数据库连接对象、错误信息
	   功能：连接到数据库
	   流程：
	   1. 构建DSN
	   2. 连接到数据库
	   3. 返回数据库连接对象、错误信息
	*/

	var dsn string
	if dbName == "" {
		// 不指定数据库,连接到MySQL服务器
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/", user, password, host, port)
	} else {
		// 指定数据库
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", user, password, host, port, dbName)
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		if dbName == "" {
			return nil, fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
		} else {
			return nil, fmt.Errorf("====== 连接到数据库 '%s' 失败！: %v ======\n", dbName, err)
		}
	}
	return db, nil
}
