## 一、`SQL`语句练习

### 1.1.基本`CRUD`操作

- 假设一个名为`students`的表,包含`id`(主键,自增)、`name`(学生姓名,字符串类型)、`age`(学生年龄,整数类型)、`grade`(学生年级,字符串类型).

- 要求

  - 编写`SQL`语句向`students`表中插入一条新纪录,学生姓名为"张三",年龄为20,年级为"三年级"
  - 编写`SQL`语句查询`students`表中所有学生年龄大于18岁的学生信息.
  - 编写`SQL`语句将`students`表中姓名为"张三"的学生年级更新为"四年级".
  - 编写`SQL`语句删除`students`表中年龄小于15岁的学生记录.


#### 程序示例

> 程序路径:  `GO-GORM/QUESTION-ONE/CRUD/main.go`

```go
package main

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Student struct {
	ID    int    `gorm:"Comment: 主键"`
	Name  string `gorm:"Comment: 姓名"`
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
		panic(fmt.Sprintf("创建数据库失败！: %v", err))
	}

	// 2.连接数据库
	db, err := connectToDatabase(DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
	if err != nil {
		panic(fmt.Sprintf("连接数据库失败！: %v", err))
	}
	fmt.Printf("成功连接到数据库 '%s'\n", DB_NAME)

	// 3.自动迁移表结构
	db.AutoMigrate(&Student{})

	// 4.创建示例数据
	// 4.1.创建姓名为"张三"、年龄为20、年级为"三年级"的单条数据
	/* 	fmt.Println("====== 创建单条数据 ======")
	   	var stu = &Student{Name: "张三", Age: 20, Grade: "三年级"}
	   	db.Create(stu)
	   	fmt.Printf("创建单条数据成功！ %v\n", stu) */

	// 4.2.创建多条数据
	/* 	fmt.Println("====== 创建多条数据 ======")
	   	// 这里是创建多条伪数据,方便后面的查询操作
	   	var stu1 = []Student{
	   		{Name: "张三0", Age: 14, Grade: "二年级"},
	   		{Name: "张三1", Age: 23, Grade: "八年级"},
	   		{Name: "张三2", Age: 25, Grade: "七年级"},
	   		{Name: "张三3", Age: 21, Grade: "五年级"},
	   		{Name: "张三4", Age: 24, Grade: "六年级"},
	   		{Name: "李四1", Age: 21, Grade: "九年级"},
	   		{Name: "王五1", Age: 15, Grade: "六年级"},
	   		{Name: "赵六1", Age: 18, Grade: "七年级"},
	   		{Name: "王麻子1", Age: 11, Grade: "三年级"},
	   		{Name: "孙七1", Age: 24, Grade: "七年级"},
	   	}
	   	db.Create(stu1)
	   	fmt.Printf("创建多条数据成功！ %v\n", stu1) */

	// 5.查询所有年龄大于18岁的学生
	/* 	var stus []Student
	   	db.Where("Age > ?", 18).Find(&stus)
	   	fmt.Printf("查询所有年龄大于18岁的学生成功！ %v\n", stus) */

	// 6.查找姓名为"张三"的学生,将年级更新为"四年级"
	/* 	fmt.Println("====== 更新年级 ======")
	   	var stu2 = &Student{}
	   	db.Model(stu2).Where("Name = ?", "张三").Update("Grade", "四年级")
	   	fmt.Printf("更新年级成功！\n")
	   	db.Model(stu2).Where("Name = ? AND Grade = ?", "张三", "四年级").Find(stu2)
	   	fmt.Printf("更新完成之后'张三的数据信息': %v\n", stu2) */

	// 7.查询年龄小于15岁的学生信息
	fmt.Println("====== 查询年龄小于15岁的学生信息 ======")
	var stu3 = []Student{}
	db.Model(&stu3).Where("Age < ?", 15).Find(&stu3)
	fmt.Printf("年龄小于15岁的学生有: %v\n", stu3)

}

// 检查数据库是否存在,不存在则创建
func createDatabaseIfNotExists(dbName, user, password, host string, port int) error {
	// 先连接到MySQL服务器(不指定数据库)
	db, err := connectToDatabase(user, password, host, port, "")
	if err != nil {
		return fmt.Errorf("连接到MySQL服务器失败！: %v", err)
	}

	// 检查数据库是否存在
	var count int64
	err = db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", dbName).Scan(&count).Error
	if err != nil {
		return fmt.Errorf("检查数据库是否存在失败！: %v", err)
	}

	// 如果数据库不存在,则创建
	if count == 0 {
		err = db.Exec(fmt.Sprintf("CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)).Error
		if err != nil {
			return fmt.Errorf("创建数据库失败！: %v", err)
		}
		fmt.Printf("数据库 '%s' 创建成功\n", dbName)
	} else {
		fmt.Printf("数据库 '%s' 已存在\n", dbName)
	}

	return nil
}

// 连接到数据库的统一方法
// 参数：用户名、密码、地址、端口、数据库名(为空则不指定数据库)
func connectToDatabase(user, password, host string, port int, dbName string) (*gorm.DB, error) {
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
			return nil, fmt.Errorf("连接到MySQL服务器失败！: %v", err)
		} else {
			return nil, fmt.Errorf("连接到数据库 '%s' 失败！: %v", dbName, err)
		}
	}
	return db, nil
}
```



### 1.2.事务语句

- 假设有两个表: `account`表(包含字段`id`主键,`balance`账户余额)和`transaction`表(包含字段`id`主键,`from_account_id`转出账户`ID`,`to_account_id`转入账户`ID`,`amount`转账资金)

- 要求

  - 编写一个程序,实现从账户`A`向账户`B`转账100元的操作.在事务中,需要先检查账户`A`的余额是否足够,如果足够则从账户`A`扣除100元,向账户`B`增加100元,并在`transaciton`表中记录该比转账信息.如果余额不足,则回滚事务.


#### 程序示例

> 程序路径:  `GO-GORM/QUESTION-ONE/TRANSACITON_SQL/main.go`

```go
package main

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Account struct {
	ID      int     `gorm:"primaryKey;autoIncrement"`
	Name    string  `gorm:"unique;not null;comment:账户名称"`
	Balance float64 `gorm:"not null;default:0;comment:账户余额"`
}

type Transaction struct {
	ID              int     `gorm:"primaryKey;autoIncrement"`
	FromAccountID   int     `gorm:"not null;comment:转出账户ID"`
	ToAccountID     int     `gorm:"not null;comment:转入账户ID"`
	FromAccountName string  `gorm:"not null;comment:转出账户名称"`
	ToAccountName   string  `gorm:"not null;comment:转入账户名称"`
	Amount          float64 `gorm:"not null;comment:转账金额"`
	CreatedAt       int64   `gorm:"autoCreateTime;comment:创建时间"`
}

func main() {
	/*
	   函数功能实现：通过用户名进行转账
	   流程：
	   1. 定义数据库连接环境变量
	   2. 先判断数据库是否存在,不存在则创建
	   3. 连接数据库
	   4. 自动迁移表结构
	   5. 批量创建账户数据
	   6. 查询所有账户
	   7. 执行转账操作
	   8. 再次查询账户余额
	   9. 查询转账记录
	   10. 测试转账失败情况（余额不足）
	   11. 测试转账给自己（应该失败）
	*/
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
	fmt.Println()

	// 2.连接数据库
	db, err := connectToDatabase(DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
	if err != nil {
		panic(fmt.Sprintf("====== 连接数据库失败！: %v ======\n", err))
	}
	fmt.Printf("====== 成功连接到数据库 '%s' ======\n", DB_NAME)
	fmt.Println()

	// 3.自动迁移表结构
	fmt.Printf("====== 创建表 Account 和 Transaction 表结构 ======\n")
	db.AutoMigrate(&Account{}, &Transaction{})
	fmt.Println()

	// 4.批量创建账户数据
	fmt.Printf("====== 创建示例账户数据 ======\n")
	accounts := []Account{
		{Name: "张三", Balance: 1000.0},
		{Name: "李四", Balance: 500.0},
		{Name: "王五", Balance: 2000.0},
	}

	for _, account := range accounts {
		db.Create(&account)
		fmt.Printf("创建账户: %s, 余额: %.2f\n", account.Name, account.Balance)
	}
	fmt.Println()

	// // 5.查询所有账户
	// fmt.Printf("\n====== 查询所有账户 ======\n")
	// var allAccounts []Account
	// db.Find(&allAccounts)
	// for _, account := range allAccounts {
	// 	fmt.Printf("账户ID: %d, 姓名: %s, 余额: %.2f\n", account.ID, account.Name, account.Balance)
	// }

	// // 6.执行转账操作
	// fmt.Printf("\n====== 执行转账操作 ======\n")
	// err = transferMoneyByName(db, "张三", "李四", 200.0) // 张三转200给李四
	// if err != nil {
	// 	fmt.Printf("转账失败: %v\n", err)
	// } else {
	// 	fmt.Printf("转账成功: 张三 -> 李四, 金额: 200.0\n")
	// }

	// // 7.再次查询账户余额
	// fmt.Printf("\n====== 转账后账户余额 ======\n")
	// var updatedAccounts []Account
	// db.Find(&updatedAccounts)
	// for _, account := range updatedAccounts {
	// 	fmt.Printf("账户ID: %d, 姓名: %s, 余额: %.2f\n", account.ID, account.Name, account.Balance)
	// }

	// // 8.查询转账记录
	// fmt.Printf("\n====== 转账记录 ======\n")
	// var transactions []Transaction
	// db.Find(&transactions)
	// for _, tx := range transactions {
	// 	fmt.Printf("转账ID: %d, %s(ID:%d) -> %s(ID:%d), 金额: %.2f, 时间: %d\n",
	// 		tx.ID, tx.FromAccountName, tx.FromAccountID, tx.ToAccountName, tx.ToAccountID, tx.Amount, tx.CreatedAt)
	// }

	// // 9.测试转账失败情况（余额不足）
	// fmt.Printf("\n====== 测试转账失败情况 ======\n")
	// err = transferMoneyByName(db, "李四", "王五", 1000.0) // 李四转1000给王五（余额不足）
	// if err != nil {
	// 	fmt.Printf("转账失败（预期）: %v\n", err)
	// }

	// 10.测试转账给自己（应该失败）
	// fmt.Printf("\n====== 测试转账给自己 ======\n")
	// err = transferMoneyByName(db, "张三", "张三", 100.0) // 张三转给自己
	// if err != nil {
	// 	fmt.Printf("转账失败（预期）: %v\n", err)
	// }

}

// 转账函数方法(通过传入用户名)
func transferMoneyByName(db *gorm.DB, fromAccountName, toAccountName string, amount float64) error {
	/*
	   传入参数：数据库连接对象、转出账户名称、转入账户名称、转账金额
	   db: 数据库连接对象
	   fromAccountName: 转出账户名称
	   toAccountName: 转入账户名称
	   amount: 转账金额

	   返回值：错误信息
	   功能：通过用户名进行转账
	   流程：
	   1. 开始事务
	   2. 检查转出账户是否存在
	   3. 检查转入账户是否存在
	   4. 检查是否是自己转给自己
	   5. 检查余额是否足够
	   6. 检查转账金额是否有效
	   7. 更新转出账户余额
	   8. 更新转入账户余额
	   9. 创建转账记录
	   10. 提交事务
	   11. 返回错误信息
	*/
	// 开始事务
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 检查转出账户是否存在
	var fromAccount Account
	if err := tx.Where("name = ?", fromAccountName).First(&fromAccount).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("转出账户 '%s' 不存在: %v", fromAccountName, err)
	}

	// 检查转入账户是否存在
	var toAccount Account
	if err := tx.Where("name = ?", toAccountName).First(&toAccount).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("转入账户 '%s' 不存在: %v", toAccountName, err)
	}

	// 检查是否是自己转给自己
	if fromAccount.ID == toAccount.ID {
		tx.Rollback()
		return fmt.Errorf("不能转账给自己")
	}

	// 检查余额是否足够
	if fromAccount.Balance < amount {
		tx.Rollback()
		return fmt.Errorf("账户 '%s' 余额不足，当前余额: %.2f, 转账金额: %.2f", fromAccountName, fromAccount.Balance, amount)
	}

	// 检查转账金额是否有效
	if amount <= 0 {
		tx.Rollback()
		return fmt.Errorf("转账金额必须大于0")
	}

	// 更新转出账户余额
	if err := tx.Model(&fromAccount).Update("balance", fromAccount.Balance-amount).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("更新转出账户 '%s' 余额失败: %v", fromAccountName, err)
	}

	// 更新转入账户余额
	if err := tx.Model(&toAccount).Update("balance", toAccount.Balance+amount).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("更新转入账户 '%s' 余额失败: %v", toAccountName, err)
	}

	// 创建转账记录
	transaction := Transaction{
		FromAccountID:   fromAccount.ID,
		ToAccountID:     toAccount.ID,
		FromAccountName: fromAccountName,
		ToAccountName:   toAccountName,
		Amount:          amount,
	}
	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("创建转账记录失败: %v", err)
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("提交事务失败: %v", err)
	}

	return nil
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
```



## 二、`Sqlx`入门

### 2.1.使用`SQL`扩展库进行查询

- 假设已经使用`Sqlx`连接到一个数据库,并且有一个`empoyees`表,包含字段`id`、`department`、`salary`.
- 要求
  - 编写`Go`代码,使用`Sqlx`查询`employees`表中所有部门为"技术部"的员工信息,并将结果映射到自定义的`Employee`结构体切片中.
  - 编写`Go`代码,使用`Sqlx`查询`employees`表中工资最高的员工信息,并将结果映射到一个`Employee`结构体中.

#### 程序示例

> 程序路径:  `GO-GORM/QUESTION-TWO/SQL-EXTEND/main.go`

```go
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
```



### 2.2.实现类型安全映射

- 假设有一个`books`表,包含字段`id`、`title`、`author`、`price`

- 要求

  - 定义一个`books`表,包含与`books`表对应的字段.
  - 编写`Go`代码,使用`Sqlx`执行一个复杂查询,例如查询价格大于50元的书籍,并将结果映射到`Book`结构体切片中,确保类型安全.


#### 程序示例

> 程序路径:  `GO-GORM/QUESTION-TWO/SQL-SECRITY-MAPPING/main.go`

```go
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
	   1.定义数据库连接环境变量
	   2.检查数据库是否存在,不存在则创建,然后连接数据库
	   3.创建books表
	   4.插入示例数据
	   5.执行复杂查询：查询价格大于50元的书籍
	   6.类型安全的结果映射

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
	   1.连接到MySQL服务器(不指定数据库)
	   2.检查数据库是否存在
	   3.如果数据库不存在,则创建
	   4.连接到指定数据库
	   5.返回数据库连接对象
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
```



## 三、进阶`GORM`

### 3.1.模型定义

- 假设要开发一个博客系统,有一下几个实体: `User`(用户)、`Post`(文章)、`Comment`(评论).
- 要求
  - 使用`Gorm`定义`User`、`Post`和`Comment`模型,其中`User`与`Post`是一对多关系(一个用户可以发布多篇文章),`Post`与`Comment`也是一对多关系(一片文章可以有个评论).
  - 编写`Go`代码,使用`Gorm`创建这些模型对应的数据库表.

#### 程序示例

> 程序路径:  `GO-GORM/QUESTION-THREE/MODELS/main.go`

```go
package main

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Username  string     `gorm:"unique;not null;size:50;comment:用户名" json:"username"`
	Email     string     `gorm:"unique;not null;size:100;comment:邮箱" json:"email"`
	Password  string     `gorm:"not null;size:255;comment:密码" json:"-"`
	Nickname  string     `gorm:"size:50;comment:昵称" json:"nickname"`
	Avatar    string     `gorm:"size:255;comment:头像URL" json:"avatar"`
	Bio       string     `gorm:"type:text;comment:个人简介" json:"bio"`
	IsActive  bool       `gorm:"default:true;comment:是否激活" json:"is_active"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 一对多关系：一个用户可以发布多篇文章
	Posts []Post `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"posts,omitempty"`
}

// Post 文章模型
type Post struct {
	ID          uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Title       string     `gorm:"not null;size:200;comment:文章标题" json:"title"`
	Content     string     `gorm:"type:longtext;not null;comment:文章内容" json:"content"`
	Summary     string     `gorm:"type:text;comment:文章摘要" json:"summary"`
	Slug        string     `gorm:"unique;size:255;comment:URL别名" json:"slug"`
	Status      string     `gorm:"default:'draft';size:20;comment:文章状态" json:"status"` // draft, published, archived
	ViewCount   int        `gorm:"default:0;comment:浏览次数" json:"view_count"`
	LikeCount   int        `gorm:"default:0;comment:点赞次数" json:"like_count"`
	IsTop       bool       `gorm:"default:false;comment:是否置顶" json:"is_top"`
	PublishedAt *time.Time `gorm:"comment:发布时间" json:"published_at"`
	CreatedAt   time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 外键：文章属于某个用户
	UserID uint `gorm:"not null;comment:用户ID" json:"user_id"`
	User   User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`

	// 一对多关系：一篇文章可以有多个评论
	Comments []Comment `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

// Comment 评论模型
type Comment struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Content   string     `gorm:"type:text;not null;comment:评论内容" json:"content"`
	Status    string     `gorm:"default:'pending';size:20;comment:评论状态" json:"status"` // pending, approved, rejected
	IPAddress string     `gorm:"size:45;comment:IP地址" json:"ip_address"`
	UserAgent string     `gorm:"size:500;comment:用户代理" json:"user_agent"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 外键：评论属于某篇文章
	PostID uint `gorm:"not null;comment:文章ID" json:"post_id"`
	Post   Post `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"post,omitempty"`

	// 外键：评论可能属于某个用户（游客评论时为空）
	UserID *uint `gorm:"comment:用户ID" json:"user_id"`
	User   *User `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`

	// 自引用：支持评论回复
	ParentID *uint     `gorm:"comment:父评论ID" json:"parent_id"`
	Parent   *Comment  `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"parent,omitempty"`
	Replies  []Comment `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"replies,omitempty"`
}

func main() {
	/*
	   博客系统模型定义和数据库表创建
	   流程：
	   1.定义数据库连接环境变量
	   2.检查数据库是否存在,不存在则创建
	   3.连接数据库
	   4.使用GORM自动迁移创建表结构
	   5.验证表创建结果
	   6.显示表结构信息
	*/
	// 1.批量定义数据库连接环境变量
	var (
		DB_USER     = "root"
		DB_PASSWORD = "root123456"
		DB_HOST     = "127.0.0.1"
		DB_PORT     = 3306
		DB_NAME     = "blog_system"
	)

	// 2.先判断数据库是否存在,不存在则创建
	fmt.Println("====== 检查数据库是否存在 ======")
	err := createDatabaseIfNotExists(DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
	if err != nil {
		panic(fmt.Sprintf("====== 创建数据库失败！: %v ======\n", err))
	}
	fmt.Println()

	// 3.连接数据库
	fmt.Println("====== 连接数据库 ======")
	db, err := connectToDatabase(DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
	if err != nil {
		panic(fmt.Sprintf("====== 连接数据库失败！: %v ======\n", err))
	}
	fmt.Printf("====== 成功连接到数据库 '%s' ======\n", DB_NAME)
	fmt.Println()

	// 4.使用GORM自动迁移创建表结构
	fmt.Println("====== 开始创建博客系统表结构 ======")
	err = db.AutoMigrate(&User{}, &Post{}, &Comment{})
	if err != nil {
		panic(fmt.Sprintf("====== 创建表结构失败！: %v ======\n", err))
	}
	fmt.Println("====== 博客系统表结构创建成功 ======")
	fmt.Println()

	// 5.验证表创建结果
	fmt.Println("====== 验证表创建结果 ======")
	err = verifyTablesCreated(db)
	if err != nil {
		fmt.Printf("验证表创建失败: %v\n", err)
	} else {
		fmt.Println("====== 所有表创建验证通过 ======")
	}
	fmt.Println()

	// 6.显示表结构信息
	fmt.Println("====== 表结构信息 ======")
	showTableInfo(db)
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
	   1.连接到MySQL服务器(不指定数据库)
	   2.检查数据库是否存在
	   3.如果数据库不存在,则创建
	   4.返回错误信息
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
	   1.构建DSN
	   2.连接到数据库
	   3.返回数据库连接对象、错误信息
	*/

	var dsn string
	if dbName == "" {
		// 不指定数据库,连接到MySQL服务器
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port)
	} else {
		// 指定数据库
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port, dbName)
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

// 验证表是否创建成功
func verifyTablesCreated(db *gorm.DB) error {
	/*
		传入参数：数据库连接对象
		返回值：错误信息
		功能：验证表是否创建成功
		流程：
		   1.验证表是否创建成功
		   2.返回错误信息
	*/

	tables := []string{"users", "posts", "comments"}
	for _, table := range tables {
		var count int64
		err := db.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", table).Scan(&count).Error
		if err != nil {
			return fmt.Errorf("检查表 %s 失败: %v", table, err)
		}

		if count == 0 {
			return fmt.Errorf("表 %s 未创建", table)
		}

		fmt.Printf("✓ 表 %s 创建成功\n", table)
	}

	return nil
}

// 显示表结构信息
func showTableInfo(db *gorm.DB) {
	/*
		传入参数：数据库连接对象
		返回值：无
		功能：显示表结构信息
		流程：
		   1.显示表结构信息
	*/

	tables := []string{"users", "posts", "comments"}

	for _, table := range tables {
		fmt.Printf("\n--- %s 表结构 ---\n", table)

		var columns []struct {
			Field   string `gorm:"column:Field"`
			Type    string `gorm:"column:Type"`
			Null    string `gorm:"column:Null"`
			Key     string `gorm:"column:Key"`
			Default string `gorm:"column:Default"`
			Extra   string `gorm:"column:Extra"`
		}

		err := db.Raw("DESCRIBE " + table).Scan(&columns).Error
		if err != nil {
			fmt.Printf("获取表 %s 结构失败: %v\n", table, err)
			continue
		}

		fmt.Printf("%-20s %-20s %-5s %-10s %-15s %-10s\n", "字段名", "类型", "空值", "键", "默认值", "额外")
		fmt.Println(strings.Repeat("-", 80))

		for _, col := range columns {
			fmt.Printf("%-20s %-20s %-5s %-10s %-15s %-10s\n",
				col.Field, col.Type, col.Null, col.Key, col.Default, col.Extra)
		}
	}
}

```



### 3.2.关联查询

- 基于上述博客系统的模型定义
- 要求
  - 编写`Go`代码,使用`Gorm`查询某个用户发布的所有文章及其对应的评论信息.
  - 编写`Go`代码,使用`Gorm`查询评论数量最多的文章信息.

#### 程序示例

> 程序路径:  `GO-GORM/QUESTION-THREE/CORRELATION-QUERY/main.go`

```go
package main

import (
	"fmt"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Username  string     `gorm:"unique;not null;size:50;comment:用户名" json:"username"`
	Email     string     `gorm:"unique;not null;size:100;comment:邮箱" json:"email"`
	Password  string     `gorm:"not null;size:255;comment:密码" json:"-"`
	Nickname  string     `gorm:"size:50;comment:昵称" json:"nickname"`
	Avatar    string     `gorm:"size:255;comment:头像URL" json:"avatar"`
	Bio       string     `gorm:"type:text;comment:个人简介" json:"bio"`
	IsActive  bool       `gorm:"default:true;comment:是否激活" json:"is_active"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 一对多关系：一个用户可以发布多篇文章
	Posts []Post `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"posts,omitempty"`
}

// Post 文章模型
type Post struct {
	ID          uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Title       string     `gorm:"not null;size:200;comment:文章标题" json:"title"`
	Content     string     `gorm:"type:longtext;not null;comment:文章内容" json:"content"`
	Summary     string     `gorm:"type:text;comment:文章摘要" json:"summary"`
	Slug        string     `gorm:"unique;size:255;comment:URL别名" json:"slug"`
	Status      string     `gorm:"default:'draft';size:20;comment:文章状态" json:"status"`
	ViewCount   int        `gorm:"default:0;comment:浏览次数" json:"view_count"`
	LikeCount   int        `gorm:"default:0;comment:点赞次数" json:"like_count"`
	IsTop       bool       `gorm:"default:false;comment:是否置顶" json:"is_top"`
	PublishedAt *time.Time `gorm:"comment:发布时间" json:"published_at"`
	CreatedAt   time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 外键：文章属于某个用户
	UserID uint `gorm:"not null;comment:用户ID" json:"user_id"`
	User   User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`

	// 一对多关系：一篇文章可以有多个评论
	Comments []Comment `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

// Comment 评论模型
type Comment struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Content   string     `gorm:"type:text;not null;comment:评论内容" json:"content"`
	Status    string     `gorm:"default:'pending';size:20;comment:评论状态" json:"status"`
	IPAddress string     `gorm:"size:45;comment:IP地址" json:"ip_address"`
	UserAgent string     `gorm:"size:500;comment:用户代理" json:"user_agent"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 外键：评论属于某篇文章
	PostID uint `gorm:"not null;comment:文章ID" json:"post_id"`
	Post   Post `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"post,omitempty"`

	// 外键：评论可能属于某个用户（游客评论时为空）
	UserID *uint `gorm:"comment:用户ID" json:"user_id"`
	User   *User `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`

	// 自引用：支持评论回复
	ParentID *uint     `gorm:"comment:父评论ID" json:"parent_id"`
	Parent   *Comment  `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"parent,omitempty"`
	Replies  []Comment `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"replies,omitempty"`
}

func main() {
	/*
	   博客系统模型定义和数据库表创建
	   流程：
	   1.定义数据库连接环境变量
	   2.检查数据库是否存在,不存在则创建
	   3.连接数据库
	   4.使用GORM自动迁移创建表结构
	   5.验证表创建结果
	   6.查询某个用户发布的所有文章及其对应的评论信息
	   7.查询评论数量最多的文章信息
	*/
	// 1.批量定义数据库连接环境变量
	var (
		DB_USER     = "root"
		DB_PASSWORD = "root123456"
		DB_HOST     = "127.0.0.1"
		DB_PORT     = 3306
		DB_NAME     = "blog_system"
	)

	// 2.先判断数据库是否存在,不存在则创建
	fmt.Println("====== 检查数据库是否存在 ======")
	err := createDatabaseIfNotExists(DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
	if err != nil {
		panic(fmt.Sprintf("====== 创建数据库失败！: %v ======\n", err))
	}
	fmt.Println()

	// 3.连接数据库
	fmt.Println("====== 连接数据库 ======")
	db, err := connectToDatabase(DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
	if err != nil {
		panic(fmt.Sprintf("====== 连接数据库失败！: %v ======\n", err))
	}
	fmt.Printf("====== 成功连接到数据库 '%s' ======\n", DB_NAME)
	fmt.Println()

	// 4.使用GORM自动迁移创建表结构
	fmt.Println("====== 开始创建博客系统表结构 ======")
	err = db.AutoMigrate(&User{}, &Post{}, &Comment{})
	if err != nil {
		panic(fmt.Sprintf("====== 创建表结构失败！: %v ======\n", err))
	}
	fmt.Println("====== 博客系统表结构创建成功 ======")
	fmt.Println()

	// 5.创建测试数据验证关联关系
	fmt.Println("====== 创建测试数据验证关联关系 ======")
	err = createTestData(db)
	if err != nil {
		fmt.Printf("创建测试数据失败: %v\n", err)
		return
	}
	fmt.Println("====== 测试数据创建成功 ======")
	fmt.Println()

	// 6.新增功能：查询用户alice发布的所有文章及其对应的评论信息
	// fmt.Println("====== 查询用户alice发布的所有文章及其对应的评论信息 ======")
	// err = queryUserPostsWithComments(db, "alice")
	// if err != nil {
	// 	fmt.Printf("查询用户文章失败: %v\n", err)
	// } else {
	// 	fmt.Println("====== 用户文章查询完成 ======")
	// }
	// fmt.Println()

	// 7.新增功能：查询评论数量最多的文章信息
	// fmt.Println("====== 查询评论数量最多的文章信息 ======")
	// err = queryMostCommentedPost(db)
	// if err != nil {
	// 	fmt.Printf("查询评论最多的文章失败: %v\n", err)
	// } else {
	// 	fmt.Println()
	// 	fmt.Println("====== 评论最多文章查询完成 ======")
	// }

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
	   1.连接到MySQL服务器(不指定数据库)
	   2.检查数据库是否存在
	   3.如果数据库不存在,则创建
	   4.返回错误信息
	*/
	// 1.先连接到MySQL服务器(不指定数据库)
	db, err := connectToDatabase(user, password, host, port, "")
	if err != nil {
		return fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
	}

	// 2.检查数据库是否存在
	var count int64
	err = db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", dbName).Scan(&count).Error
	if err != nil {
		return fmt.Errorf("====== 检查数据库是否存在失败！: %v ======\n", err)
	}

	// 3.如果数据库不存在,则创建
	if count == 0 {
		err = db.Exec(fmt.Sprintf("CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)).Error
		if err != nil {
			return fmt.Errorf("====== 创建数据库失败！: %v ======\n", err)
		}
		fmt.Printf("====== 数据库 '%s' 创建成功 ======\n", dbName)
	} else {
		fmt.Printf("====== 数据库 '%s' 已存在 ======\n", dbName)
	}

	// 4.返回错误信息
	return nil
}

// 连接到数据库的统一方法
func connectToDatabase(user, password, host string, port int, dbName string) (*gorm.DB, error) {
	/*
	   传入参数：用户名、密码、地址、端口、数据库名(为空则不指定数据库)
	   返回值：数据库连接对象、错误信息
	   功能：连接到数据库
	   流程：
	   1.构建DSN
	   2.连接到数据库
	   3.返回数据库连接对象、错误信息
	*/

	// 1.构建DSN
	var dsn string
	if dbName == "" {
		// 不指定数据库,连接到MySQL服务器
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port)
	} else {
		// 指定数据库
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port, dbName)
	}

	// 2.连接到数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		if dbName == "" {
			return nil, fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
		} else {
			return nil, fmt.Errorf("====== 连接到数据库 '%s' 失败！: %v ======\n", dbName, err)
		}
	}

	// 3.返回数据库连接对象、错误信息
	return db, nil
}

// 创建测试数据验证关联关系
func createTestData(db *gorm.DB) error {
	/*
		传入参数：数据库连接对象
		返回值：错误信息
		功能：创建测试数据验证关联关系
		流程：
		   1.创建用户
		   2.创建文章
		   3.创建评论
		   4.创建评论回复
	*/

	// 1.创建用户
	fmt.Println("创建用户数据...")
	users := []User{
		{
			Username: "alice",
			Email:    "alice@example.com",
			Password: "password123",
			Nickname: "爱丽丝",
			Bio:      "热爱写作的程序员",
			IsActive: true,
		},
		{
			Username: "bob",
			Email:    "bob@example.com",
			Password: "password456",
			Nickname: "鲍勃",
			Bio:      "技术博客作者",
			IsActive: true,
		},
		{
			Username: "charlie",
			Email:    "charlie@example.com",
			Password: "password789",
			Nickname: "查理",
			Bio:      "评论爱好者",
			IsActive: true,
		},
	}

	for i := range users {
		if err := db.Create(&users[i]).Error; err != nil {
			return fmt.Errorf("创建用户失败: %v", err)
		}
		fmt.Printf("✓ 创建用户: %s (ID: %d)\n", users[i].Username, users[i].ID)
	}

	// 2.创建文章
	fmt.Println("\n创建文章数据...")
	now := time.Now()
	posts := []Post{
		{
			Title:       "Go语言入门指南",
			Content:     "Go语言是一门由Google开发的编程语言，具有简洁、高效、并发安全的特点...",
			Summary:     "介绍Go语言的基本概念和特性",
			Slug:        "go-language-guide",
			Status:      "published",
			ViewCount:   150,
			LikeCount:   25,
			IsTop:       true,
			PublishedAt: &now,
			UserID:      users[0].ID, // Alice的文章
		},
		{
			Title:       "GORM使用技巧",
			Content:     "GORM是Go语言中最流行的ORM库之一，提供了丰富的功能...",
			Summary:     "分享GORM的高级使用技巧",
			Slug:        "gorm-tips",
			Status:      "published",
			ViewCount:   200,
			LikeCount:   30,
			IsTop:       false,
			PublishedAt: &now,
			UserID:      users[0].ID, // Alice的文章
		},
		{
			Title:       "数据库设计最佳实践",
			Content:     "良好的数据库设计是应用程序成功的关键因素...",
			Summary:     "探讨数据库设计的原则和方法",
			Slug:        "database-design-best-practices",
			Status:      "published",
			ViewCount:   300,
			LikeCount:   45,
			IsTop:       true,
			PublishedAt: &now,
			UserID:      users[1].ID, // Bob的文章
		},
		{
			Title:     "博客系统架构设计",
			Content:   "设计一个可扩展的博客系统需要考虑多个方面...",
			Summary:   "分析博客系统的架构设计",
			Slug:      "blog-system-architecture",
			Status:    "draft",
			ViewCount: 0,
			LikeCount: 0,
			IsTop:     false,
			UserID:    users[1].ID, // Bob的草稿
		},
	}

	for i := range posts {
		if err := db.Create(&posts[i]).Error; err != nil {
			return fmt.Errorf("创建文章失败: %v", err)
		}
		fmt.Printf("✓ 创建文章: %s (ID: %d, 作者: %s)\n", posts[i].Title, posts[i].ID, users[posts[i].UserID-1].Username)
	}

	// 3.创建评论
	fmt.Println("\n创建评论数据...")
	comments := []Comment{
		{
			Content:   "这篇文章写得很好，学到了很多！",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,  // Go语言入门指南的评论
			UserID:    &users[2].ID, // Charlie的评论
		},
		{
			Content:   "感谢分享，期待更多关于Go的内容",
			Status:    "approved",
			IPAddress: "192.168.1.101",
			UserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			PostID:    posts[0].ID,  // Go语言入门指南的评论
			UserID:    &users[1].ID, // Bob的评论
		},
		{
			Content:   "GORM确实很强大，感谢分享这些技巧",
			Status:    "approved",
			IPAddress: "192.168.1.102",
			UserAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
			PostID:    posts[1].ID,  // GORM使用技巧的评论
			UserID:    &users[2].ID, // Charlie的评论
		},
		{
			Content:   "数据库设计确实很重要，这篇文章很有价值",
			Status:    "approved",
			IPAddress: "192.168.1.103",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[2].ID,  // 数据库设计最佳实践的评论
			UserID:    &users[0].ID, // Alice的评论
		},
		{
			Content:   "游客评论：网站设计得很不错！",
			Status:    "pending",
			IPAddress: "192.168.1.104",
			UserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
			PostID:    posts[2].ID, // 数据库设计最佳实践的评论
			UserID:    nil,         // 游客评论
		},
	}

	for i := range comments {
		if err := db.Create(&comments[i]).Error; err != nil {
			return fmt.Errorf("创建评论失败: %v", err)
		}
		author := "游客"
		if comments[i].UserID != nil {
			author = users[*comments[i].UserID-1].Username
		}
		fmt.Printf("✓ 创建评论: %s (ID: %d, 作者: %s)\n", safeSubstring(comments[i].Content, 20), comments[i].ID, author)
	}

	// 4.创建评论回复
	fmt.Println("\n创建评论回复数据...")
	replies := []Comment{
		{
			Content:   "谢谢你的支持！",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,
			UserID:    &users[0].ID,    // Alice回复
			ParentID:  &comments[0].ID, // 回复Charlie的评论
		},
		{
			Content:   "我会继续分享更多内容的",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,
			UserID:    &users[0].ID,    // Alice回复
			ParentID:  &comments[1].ID, // 回复Bob的评论
		},
	}

	for i := range replies {
		if err := db.Create(&replies[i]).Error; err != nil {
			return fmt.Errorf("创建评论回复失败: %v", err)
		}
		fmt.Printf("✓ 创建回复: %s (ID: %d, 回复评论ID: %d)\n", replies[i].Content, replies[i].ID, *replies[i].ParentID)
	}

	return nil
}

// 安全截取字符串，避免越界
func safeSubstring(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// 查询指定用户发布的所有文章及其对应的评论信息
func queryUserPostsWithComments(db *gorm.DB, username string) error {
	/*
		功能：查询指定用户的所有文章及其评论信息
		参数：
		  - db: 数据库连接对象
		  - username: 用户名
		返回：错误信息
	*/

	// 1.查找用户
	var user User
	err := db.Where("username = ?", username).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("用户 '%s' 不存在", username)
		}
		return fmt.Errorf("查询用户失败: %v", err)
	}

	fmt.Printf("✓ 找到用户: %s (ID: %d, 昵称: %s)\n", user.Username, user.ID, user.Nickname)

	// 2.查询用户的所有文章，并预加载评论信息
	var posts []Post
	err = db.Where("user_id = ?", user.ID).
		Preload("Comments").
		Preload("Comments.User").
		Order("created_at DESC").
		Find(&posts).Error
	if err != nil {
		return fmt.Errorf("查询用户文章失败: %v", err)
	}

	if len(posts) == 0 {
		fmt.Printf("！用户 '%s' 还没有发布任何文章\n", username)
		return nil
	}

	fmt.Printf("✓ 用户 '%s' 共发布了 %d 篇文章\n", username, len(posts))
	fmt.Println()

	// 3.显示每篇文章及其评论信息
	for i, post := range posts {
		fmt.Printf("====== 【文章 %d】%s ======\n", i+1, post.Title)
		fmt.Printf("内容摘要: %s\n", safeSubstring(post.Content, 50))
		fmt.Printf("状态: %s | 浏览次数: %d | 点赞数: %d\n", post.Status, post.ViewCount, post.LikeCount)
		fmt.Printf("发布时间: %s\n", post.CreatedAt.Format("2006-01-02 15:04:05"))

		// 显示评论信息
		if len(post.Comments) == 0 {
			fmt.Printf("暂无评论\n")
		} else {
			fmt.Printf("评论 (%d 条):\n", len(post.Comments))
			for j, comment := range post.Comments {
				author := "游客"
				if comment.User != nil {
					author = comment.User.Username
				}
				fmt.Printf("    %d. %s (作者: %s, 状态: %s)\n",
					j+1, safeSubstring(comment.Content, 40), author, comment.Status)
			}
		}
		fmt.Println()
	}

	return nil
}

// 查询评论数量最多的文章信息
func queryMostCommentedPost(db *gorm.DB) error {
	/*
		功能：查询评论数量最多的文章信息
		参数：
		  - db: 数据库连接对象
		返回：错误信息
	*/

	fmt.Println("====== 方式一: 使用子查询找到评论数量最多的文章... ======")
	var post Post
	err := db.Preload("User").
		Preload("Comments").
		Preload("Comments.User").
		Where("id = (SELECT post_id FROM comments WHERE deleted_at IS NULL GROUP BY post_id ORDER BY COUNT(*) DESC LIMIT 1)").
		First(&post).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("没有找到任何文章或评论数据")
		}
		return fmt.Errorf("查询评论最多的文章失败: %v", err)
	}

	fmt.Printf("✓ 找到评论最多的文章: %s\n", post.Title)
	fmt.Printf("作者: %s (ID: %d)\n", post.User.Username, post.User.ID)
	fmt.Printf("状态: %s | 浏览次数: %d | 点赞数: %d\n", post.Status, post.ViewCount, post.LikeCount)
	fmt.Printf("发布时间: %s\n", post.CreatedAt.Format("2006-01-02 15:04:05"))
	fmt.Printf("评论数量: %d 条\n", len(post.Comments))
	fmt.Println()

	// 显示评论详情
	if len(post.Comments) > 0 {
		fmt.Println("评论详情:")
		for i, comment := range post.Comments {
			author := "游客"
			if comment.User != nil {
				author = comment.User.Username
			}
			fmt.Printf("  %d.%s\n", i+1, comment.Content)
			fmt.Printf("     作者: %s | 状态: %s | 时间: %s\n",
				author, comment.Status, comment.CreatedAt.Format("2006-01-02 15:04:05"))
			fmt.Println()
		}
	}

	// 方法2: 使用原生SQL查询(备选方案)
	fmt.Println("====== 方式二: 使用原生SQL查询找到评论数量最多的文章... ======")
	fmt.Println("使用原生SQL查询验证结果:")
	var result struct {
		PostID       uint   `json:"post_id"`
		Title        string `json:"title"`
		Author       string `json:"author"`
		CommentCount int    `json:"comment_count"`
	}

	err = db.Raw(`
		SELECT p.id as post_id, p.title, u.username as author, COUNT(c.id) as comment_count
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		LEFT JOIN comments c ON p.id = c.post_id AND c.deleted_at IS NULL
		WHERE p.deleted_at IS NULL
		GROUP BY p.id, p.title, u.username
		ORDER BY comment_count DESC
		LIMIT 1
	`).Scan(&result).Error

	if err != nil {
		fmt.Printf("！原生SQL查询失败: %v\n", err)
	} else {
		fmt.Printf("✓ SQL验证结果: 文章 '%s' (作者: %s) 有 %d 条评论\n",
			result.Title, result.Author, result.CommentCount)
	}

	return nil
}
```



### 3.3.钩子函数

- 继续使用博客系统的模型
- 要求
  - 为`Post`模型增加一个钩子函数,在文章创建时自动更新用户的文章数量统计字段.
  - 为`Comment`模型添加一个钩子函数,在评论删除时检查文章的评论数量,如果评论数量为0,则更新文章的评论状态为"无评论".

#### 程序示例

> 程序路径:  `GO-GORM/QUESTION-THREE/HOOK-QUERY/main.go`

```go
package main

import (
	"fmt"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User用户模型
type User struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Username  string     `gorm:"unique;not null;size:50;comment:用户名" json:"username"`
	Email     string     `gorm:"unique;not null;size:100;comment:邮箱" json:"email"`
	Password  string     `gorm:"not null;size:255;comment:密码" json:"-"`
	Nickname  string     `gorm:"size:50;comment:昵称" json:"nickname"`
	Avatar    string     `gorm:"size:255;comment:头像URL" json:"avatar"`
	Bio       string     `gorm:"type:text;comment:个人简介" json:"bio"`
	IsActive  bool       `gorm:"default:true;comment:是否激活" json:"is_active"`
	PostCount int        `gorm:"default:0;comment:文章数量统计" json:"post_count"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 一对多关系：一个用户可以发布多篇文章
	Posts []Post `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"posts,omitempty"`
}

// Post文章模型
type Post struct {
	ID          uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Title       string     `gorm:"not null;size:200;comment:文章标题" json:"title"`
	Content     string     `gorm:"type:longtext;not null;comment:文章内容" json:"content"`
	Summary     string     `gorm:"type:text;comment:文章摘要" json:"summary"`
	Slug        string     `gorm:"unique;size:255;comment:URL别名" json:"slug"`
	Status      string     `gorm:"default:'draft';size:20;comment:文章状态" json:"status"`
	ViewCount   int        `gorm:"default:0;comment:浏览次数" json:"view_count"`
	LikeCount   int        `gorm:"default:0;comment:点赞次数" json:"like_count"`
	IsTop       bool       `gorm:"default:false;comment:是否置顶" json:"is_top"`
	PublishedAt *time.Time `gorm:"comment:发布时间" json:"published_at"`
	CreatedAt   time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 外键：文章属于某个用户
	UserID uint `gorm:"not null;comment:用户ID" json:"user_id"`
	User   User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`

	// 一对多关系：一篇文章可以有多个评论
	Comments []Comment `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

// AfterCreate Post模型创建后的钩子函数
func (p *Post) AfterCreate(tx *gorm.DB) error {
	/*
		功能：在文章创建后自动更新用户的文章数量统计
		参数：
		  - tx: 数据库事务对象
		返回：错误信息
	*/

	// 1.更新用户的文章数量统计
	err := tx.Model(&User{}).Where("id = ?", p.UserID).Update("post_count", gorm.Expr("post_count + 1")).Error
	if err != nil {
		return fmt.Errorf("更新用户文章数量统计失败: %v", err)
	}

	fmt.Printf("✓ 文章 '%s' 创建成功，已更新用户文章数量统计\n", p.Title)
	return nil
}

// Comment评论模型
type Comment struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Content   string     `gorm:"type:text;not null;comment:评论内容" json:"content"`
	Status    string     `gorm:"default:'pending';size:20;comment:评论状态" json:"status"`
	IPAddress string     `gorm:"size:45;comment:IP地址" json:"ip_address"`
	UserAgent string     `gorm:"size:500;comment:用户代理" json:"user_agent"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 外键：评论属于某篇文章
	PostID uint `gorm:"not null;comment:文章ID" json:"post_id"`
	Post   Post `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"post,omitempty"`

	// 外键：评论可能属于某个用户（游客评论时为空）
	UserID *uint `gorm:"comment:用户ID" json:"user_id"`
	User   *User `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`

	// 自引用：支持评论回复
	ParentID *uint     `gorm:"comment:父评论ID" json:"parent_id"`
	Parent   *Comment  `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"parent,omitempty"`
	Replies  []Comment `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"replies,omitempty"`
}

// AfterDelete Comment模型删除后的钩子函数
func (c *Comment) AfterDelete(tx *gorm.DB) error {
	/*
		功能：在评论删除后检查文章的评论数量，如果评论数量为0，则更新文章的评论状态
		参数：
		  - tx: 数据库事务对象
		返回：错误信息
	*/

	// 1.检查文章的评论数量
	var commentCount int64
	err := tx.Model(&Comment{}).Where("post_id = ? AND deleted_at IS NULL", c.PostID).Count(&commentCount).Error
	if err != nil {
		return fmt.Errorf("检查文章评论数量失败: %v", err)
	}

	// 2.如果评论数量为0,更新文章的评论状态
	if commentCount == 0 {
		err = tx.Model(&Post{}).Where("id = ?", c.PostID).Update("status", "无评论").Error
		if err != nil {
			return fmt.Errorf("更新文章评论状态失败: %v", err)
		}
		fmt.Printf("✓ 评论删除成功，文章评论数量为0，已更新文章状态为'无评论'\n")
	} else {
		fmt.Printf("✓ 评论删除成功，文章还有 %d 条评论\n", commentCount)
	}

	return nil
}

func main() {
	/*
	   博客系统模型定义和数据库表创建
	   流程：
	   1.定义数据库连接环境变量
	   2.检查数据库是否存在,不存在则创建
	   3.连接数据库
	   4.使用GORM自动迁移创建表结构
	   5.创建测试数据验证关联关系
	   6.测试Post模型钩子函数(文章创建时更新用户文章数量统计)
	   7.测试Comment模型钩子函数(评论删除时检查文章评论数量)
	*/
	// 1.批量定义数据库连接环境变量
	var (
		DB_USER     = "root"
		DB_PASSWORD = "root123456"
		DB_HOST     = "127.0.0.1"
		DB_PORT     = 3306
		DB_NAME     = "blog_system"
	)

	// 2.先判断数据库是否存在,不存在则创建
	fmt.Println("====== 检查数据库是否存在 ======")
	err := createDatabaseIfNotExists(DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
	if err != nil {
		panic(fmt.Sprintf("====== 创建数据库失败！: %v ======\n", err))
	}
	fmt.Println()

	// 3.连接数据库
	fmt.Println("====== 连接数据库 ======")
	db, err := connectToDatabase(DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
	if err != nil {
		panic(fmt.Sprintf("====== 连接数据库失败！: %v ======\n", err))
	}
	fmt.Printf("====== 成功连接到数据库 '%s' ======\n", DB_NAME)
	fmt.Println()

	// 4.使用GORM自动迁移创建表结构
	fmt.Println("====== 开始创建博客系统表结构 ======")
	err = db.AutoMigrate(&User{}, &Post{}, &Comment{})
	if err != nil {
		panic(fmt.Sprintf("====== 创建表结构失败！: %v ======\n", err))
	}
	fmt.Println("====== 博客系统表结构创建成功 ======")
	fmt.Println()

	// 5.创建测试数据验证关联关系
	fmt.Println("====== 创建测试数据验证关联关系 ======")
	err = createTestData(db)
	if err != nil {
		fmt.Printf("创建测试数据失败: %v\n", err)
		return
	}
	fmt.Println("====== 测试数据创建成功 ======")
	fmt.Println()

	// 6.测试Post模型钩子函数(文章创建时更新用户文章数量统计)
	// fmt.Println("====== 测试Post模型钩子函数 ======")
	// err = testPostHook(db)
	// if err != nil {
	// 	fmt.Printf("测试Post钩子函数失败: %v\n", err)
	// } else {
	// 	fmt.Println("====== Post钩子函数测试完成 ======")
	// }
	// fmt.Println()

	// 7.测试Comment模型钩子函数(评论删除时检查文章评论数量)
	// fmt.Println("====== 测试Comment模型钩子函数 ======")
	// err = testCommentHook(db)
	// if err != nil {
	// 	fmt.Printf("测试Comment钩子函数失败: %v\n", err)
	// } else {
	// 	fmt.Println("====== Comment钩子函数测试完成 ======")
	// }
	// fmt.Println()

	// fmt.Println("====== 博客系统钩子函数功能演示完成 ======")

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
	   1.连接到MySQL服务器(不指定数据库)
	   2.检查数据库是否存在
	   3.如果数据库不存在,则创建
	   4.返回错误信息
	*/
	// 1.先连接到MySQL服务器(不指定数据库)
	db, err := connectToDatabase(user, password, host, port, "")
	if err != nil {
		return fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
	}

	// 2.检查数据库是否存在
	var count int64
	err = db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", dbName).Scan(&count).Error
	if err != nil {
		return fmt.Errorf("====== 检查数据库是否存在失败！: %v ======\n", err)
	}

	// 3.如果数据库不存在,则创建
	if count == 0 {
		err = db.Exec(fmt.Sprintf("CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)).Error
		if err != nil {
			return fmt.Errorf("====== 创建数据库失败！: %v ======\n", err)
		}
		fmt.Printf("====== 数据库 '%s' 创建成功 ======\n", dbName)
	} else {
		fmt.Printf("====== 数据库 '%s' 已存在 ======\n", dbName)
	}

	// 4.返回错误信息
	return nil
}

// 连接到数据库的统一方法
func connectToDatabase(user, password, host string, port int, dbName string) (*gorm.DB, error) {
	/*
	   传入参数：用户名、密码、地址、端口、数据库名(为空则不指定数据库)
	   返回值：数据库连接对象、错误信息
	   功能：连接到数据库
	   流程：
	   1.构建DSN
	   2.连接到数据库
	   3.返回数据库连接对象、错误信息
	*/

	// 1.构建DSN
	var dsn string
	if dbName == "" {
		// 不指定数据库,连接到MySQL服务器
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port)
	} else {
		// 指定数据库
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port, dbName)
	}

	// 2.连接到数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		if dbName == "" {
			return nil, fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
		} else {
			return nil, fmt.Errorf("====== 连接到数据库 '%s' 失败！: %v ======\n", dbName, err)
		}
	}

	// 3.返回数据库连接对象、错误信息
	return db, nil
}

// 创建测试数据验证关联关系
func createTestData(db *gorm.DB) error {
	/*
		传入参数：数据库连接对象
		返回值：错误信息
		功能：创建测试数据验证关联关系
		流程：
		   1.创建用户
		   2.创建文章
		   3.创建评论
		   4.创建评论回复
	*/

	// 1.创建用户
	fmt.Println("创建用户数据...")
	users := []User{
		{
			Username: "alice",
			Email:    "alice@example.com",
			Password: "password123",
			Nickname: "爱丽丝",
			Bio:      "热爱写作的程序员",
			IsActive: true,
		},
		{
			Username: "bob",
			Email:    "bob@example.com",
			Password: "password456",
			Nickname: "鲍勃",
			Bio:      "技术博客作者",
			IsActive: true,
		},
		{
			Username: "charlie",
			Email:    "charlie@example.com",
			Password: "password789",
			Nickname: "查理",
			Bio:      "评论爱好者",
			IsActive: true,
		},
	}

	for i := range users {
		if err := db.Create(&users[i]).Error; err != nil {
			return fmt.Errorf("创建用户失败: %v", err)
		}
		fmt.Printf("✓ 创建用户: %s (ID: %d)\n", users[i].Username, users[i].ID)
	}

	// 2.创建文章
	fmt.Println("\n创建文章数据...")
	now := time.Now()
	posts := []Post{
		{
			Title:       "Go语言入门指南",
			Content:     "Go语言是一门由Google开发的编程语言，具有简洁、高效、并发安全的特点...",
			Summary:     "介绍Go语言的基本概念和特性",
			Slug:        "go-language-guide",
			Status:      "published",
			ViewCount:   150,
			LikeCount:   25,
			IsTop:       true,
			PublishedAt: &now,
			UserID:      users[0].ID, // Alice的文章
		},
		{
			Title:       "GORM使用技巧",
			Content:     "GORM是Go语言中最流行的ORM库之一，提供了丰富的功能...",
			Summary:     "分享GORM的高级使用技巧",
			Slug:        "gorm-tips",
			Status:      "published",
			ViewCount:   200,
			LikeCount:   30,
			IsTop:       false,
			PublishedAt: &now,
			UserID:      users[0].ID, // Alice的文章
		},
		{
			Title:       "数据库设计最佳实践",
			Content:     "良好的数据库设计是应用程序成功的关键因素...",
			Summary:     "探讨数据库设计的原则和方法",
			Slug:        "database-design-best-practices",
			Status:      "published",
			ViewCount:   300,
			LikeCount:   45,
			IsTop:       true,
			PublishedAt: &now,
			UserID:      users[1].ID, // Bob的文章
		},
		{
			Title:     "博客系统架构设计",
			Content:   "设计一个可扩展的博客系统需要考虑多个方面...",
			Summary:   "分析博客系统的架构设计",
			Slug:      "blog-system-architecture",
			Status:    "draft",
			ViewCount: 0,
			LikeCount: 0,
			IsTop:     false,
			UserID:    users[1].ID, // Bob的草稿
		},
	}

	for i := range posts {
		if err := db.Create(&posts[i]).Error; err != nil {
			return fmt.Errorf("创建文章失败: %v", err)
		}
		fmt.Printf("✓ 创建文章: %s (ID: %d, 作者: %s)\n", posts[i].Title, posts[i].ID, users[posts[i].UserID-1].Username)
	}

	// 3.创建评论
	fmt.Println("\n创建评论数据...")
	comments := []Comment{
		{
			Content:   "这篇文章写得很好，学到了很多！",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,  // Go语言入门指南的评论
			UserID:    &users[2].ID, // Charlie的评论
		},
		{
			Content:   "感谢分享，期待更多关于Go的内容",
			Status:    "approved",
			IPAddress: "192.168.1.101",
			UserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			PostID:    posts[0].ID,  // Go语言入门指南的评论
			UserID:    &users[1].ID, // Bob的评论
		},
		{
			Content:   "GORM确实很强大，感谢分享这些技巧",
			Status:    "approved",
			IPAddress: "192.168.1.102",
			UserAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
			PostID:    posts[1].ID,  // GORM使用技巧的评论
			UserID:    &users[2].ID, // Charlie的评论
		},
		{
			Content:   "数据库设计确实很重要，这篇文章很有价值",
			Status:    "approved",
			IPAddress: "192.168.1.103",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[2].ID,  // 数据库设计最佳实践的评论
			UserID:    &users[0].ID, // Alice的评论
		},
		{
			Content:   "游客评论：网站设计得很不错！",
			Status:    "pending",
			IPAddress: "192.168.1.104",
			UserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
			PostID:    posts[2].ID, // 数据库设计最佳实践的评论
			UserID:    nil,         // 游客评论
		},
	}

	for i := range comments {
		if err := db.Create(&comments[i]).Error; err != nil {
			return fmt.Errorf("创建评论失败: %v", err)
		}
		author := "游客"
		if comments[i].UserID != nil {
			author = users[*comments[i].UserID-1].Username
		}
		fmt.Printf("✓ 创建评论: %s (ID: %d, 作者: %s)\n", safeSubstring(comments[i].Content, 20), comments[i].ID, author)
	}

	// 4.创建评论回复
	fmt.Println("\n创建评论回复数据...")
	replies := []Comment{
		{
			Content:   "谢谢你的支持！",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,
			UserID:    &users[0].ID,    // Alice回复
			ParentID:  &comments[0].ID, // 回复Charlie的评论
		},
		{
			Content:   "我会继续分享更多内容的",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,
			UserID:    &users[0].ID,    // Alice回复
			ParentID:  &comments[1].ID, // 回复Bob的评论
		},
	}

	for i := range replies {
		if err := db.Create(&replies[i]).Error; err != nil {
			return fmt.Errorf("创建评论回复失败: %v", err)
		}
		fmt.Printf("✓ 创建回复: %s (ID: %d, 回复评论ID: %d)\n", replies[i].Content, replies[i].ID, *replies[i].ParentID)
	}

	return nil
}

// 安全截取字符串，避免越界
func safeSubstring(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// 测试Post模型钩子函数
func testPostHook(db *gorm.DB) error {
	/*
		功能：测试Post模型的AfterCreate钩子函数
		参数：
		  - db: 数据库连接对象
		返回：错误信息
	*/

	// 1.查询现有用户
	var user User
	err := db.Where("username = ?", "alice").First(&user).Error
	if err != nil {
		return fmt.Errorf("查询用户失败: %v", err)
	}

	fmt.Printf("✓ 找到用户: %s (ID: %d, 当前文章数量: %d)\n", user.Username, user.ID, user.PostCount)

	// 2.创建新文章测试钩子函数
	newPost := Post{
		Title:     "测试钩子函数的新文章",
		Content:   "这是一篇用于测试Post模型AfterCreate钩子函数的新文章...",
		Summary:   "测试钩子函数",
		Slug:      "test-hook-post",
		Status:    "published",
		ViewCount: 0,
		LikeCount: 0,
		IsTop:     false,
		UserID:    user.ID,
	}

	err = db.Create(&newPost).Error
	if err != nil {
		return fmt.Errorf("创建测试文章失败: %v", err)
	}

	// 3.验证用户文章数量是否已更新
	var updatedUser User
	err = db.Where("id = ?", user.ID).First(&updatedUser).Error
	if err != nil {
		return fmt.Errorf("查询更新后的用户失败: %v", err)
	}

	fmt.Printf("✓ 文章创建后，用户文章数量: %d (增加了 %d 篇)\n",
		updatedUser.PostCount, updatedUser.PostCount-user.PostCount)

	return nil
}

// 测试Comment模型钩子函数
func testCommentHook(db *gorm.DB) error {
	/*
		功能：测试Comment模型的AfterDelete钩子函数
		参数：
		  - db: 数据库连接对象
		返回：错误信息
	*/

	// 1.查询一篇文章及其评论
	var post Post
	err := db.Preload("Comments").Where("title LIKE ?", "%Go语言入门指南%").First(&post).Error
	if err != nil {
		return fmt.Errorf("查询文章失败: %v", err)
	}

	fmt.Printf("✓ 找到文章: %s (ID: %d, 当前状态: %s, 评论数量: %d)\n",
		post.Title, post.ID, post.Status, len(post.Comments))

	if len(post.Comments) == 0 {
		fmt.Println("！ 该文章没有评论，无法测试删除钩子函数")
		return nil
	}

	// 2.删除所有评论测试钩子函数
	for i, comment := range post.Comments {
		fmt.Printf("正在删除评论 %d: %s\n", i+1, safeSubstring(comment.Content, 30))

		err = db.Delete(&comment).Error
		if err != nil {
			return fmt.Errorf("删除评论失败: %v", err)
		}
	}

	// 3.验证文章状态是否已更新
	var updatedPost Post
	err = db.Where("id = ?", post.ID).First(&updatedPost).Error
	if err != nil {
		return fmt.Errorf("查询更新后的文章失败: %v", err)
	}

	fmt.Printf("✓ 评论删除后，文章状态: %s\n", updatedPost.Status)

	return nil
}
```

