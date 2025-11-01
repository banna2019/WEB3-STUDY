package main

import (
	"fmt"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

// Employee 员工结构体
type Employee struct {
	ID         int     `db:"id"`
	Department string  `db:"department"`
	Salary     float64 `db:"salary"`
}

func main() {
	/*
	   函数功能实现：使用sqlx连接数据库并操作employees表
	   流程：
	   1. 定义数据库连接环境变量
	   2. 检查数据库是否存在,不存在则创建,然后连接数据库
	   3. 创建employees表
	   4. 插入示例数据
	   5. 查询所有员工
	   6. 查询工资最高的员工

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
	}
	defer db.Close()
	fmt.Printf("====== 成功连接到数据库 '%s' ======\n", DB_NAME)
	fmt.Println()

	// 3.创建employees表
	// fmt.Println("====== 创建employees表 ======")
	// err = createEmployeesTable(db)
	// if err != nil {
	// 	fmt.Printf("创建表失败: %v\n", err)
	// }
	// fmt.Printf("====== employees表创建成功 ======\n")
	// fmt.Println()

	// 4.插入示例数据
	// fmt.Println("====== 插入示例数据 ======")
	// err = insertSampleData(db)
	// if err != nil {
	// 	fmt.Printf("插入数据失败: %v\n", err)
	// }
	// fmt.Printf("====== 示例数据插入成功 ======\n")
	// fmt.Println()

	// 5.查询所有员工
	fmt.Println("====== 查询所有员工 ======")
	employees, err := getAllEmployees(db)
	if err != nil {
		fmt.Printf("查询员工失败: %v", err)
	}
	for _, emp := range employees {
		fmt.Printf("ID: %d, 部门: %s, 薪资: %.2f\n", emp.ID, emp.Department, emp.Salary)
	}
	fmt.Println()

	// 6.查询工资最高的员工
	fmt.Println("====== 查询工资最高的员工 ======")
	employees, err = getHighestSalaryEmployees(db)
	if err != nil {
		fmt.Printf("查询工资最高的员工失败: %v", err)
	}
	// for _, emp := range employees {
	// 	fmt.Printf("ID: %d, 部门: %s, 薪资: %.2f\n", emp.ID, emp.Department, emp.Salary)
	// }
	fmt.Printf("查询工资最高的员工信息: %v\n", employees)
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

// 1.创建employees表
func createEmployeesTable(db *sqlx.DB) error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS employees (
		id INT AUTO_INCREMENT PRIMARY KEY,
		department VARCHAR(50) NOT NULL,
		salary DECIMAL(10,2) NOT NULL
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

	_, err := db.Exec(createTableSQL)
	return err
}

// 2.插入示例数据
func insertSampleData(db *sqlx.DB) error {
	employees := []Employee{
		{Department: "技术部", Salary: 12000.0},
		{Department: "技术部", Salary: 20000.0},
		{Department: "技术部", Salary: 8000.0},
		{Department: "技术部", Salary: 10000.0},
		{Department: "技术部", Salary: 9000.0},
		{Department: "技术部", Salary: 20000.0},
		{Department: "技术部", Salary: 11000.0},
		{Department: "技术部", Salary: 13000.0},
		{Department: "技术部", Salary: 20000.0},
		{Department: "技术部", Salary: 16000.0},
		{Department: "技术部", Salary: 17000.0},
		{Department: "技术部", Salary: 18000.0},
	}

	insertSQL := `INSERT INTO employees (department, salary) VALUES (?, ?)`
	for _, emp := range employees {
		_, err := db.Exec(insertSQL, emp.Department, emp.Salary)
		if err != nil {
			return err
		}
	}
	return nil
}

// 3.查询所有员工
func getAllEmployees(db *sqlx.DB) ([]Employee, error) {
	var employees []Employee
	query := `SELECT id, department, salary FROM employees ORDER BY id`
	err := db.Select(&employees, query)
	return employees, err
}

// 4.查找工资最高的员工
func getHighestSalaryEmployees(db *sqlx.DB) ([]Employee, error) {
	var employees []Employee
	// 查询所有具有最高工资的员工（可能有多条记录）
	query := `
		SELECT id, department, salary 
		FROM employees 
		WHERE salary = (SELECT MAX(salary) FROM employees)
		ORDER BY id`
	err := db.Select(&employees, query)
	return employees, err
}
