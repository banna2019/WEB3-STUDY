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
