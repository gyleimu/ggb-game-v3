const mysql = require('mysql2/promise');

let pool = null;

// 创建连接池
async function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT, 10) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ggb_game',
            waitForConnections: true,
            connectionLimit: 10,
            charset: 'utf8mb4'
        });
    }
    return pool;
}

// 通用查询（推荐用 execute 防注入）
async function query(sql, params = []) {
    const p = await getPool();
    const [rows] = await p.execute(sql, params);
    return rows;
}

// 获取单条
async function getOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

// 插入/更新/删除
async function insert(sql, params = []) {
    const p = await getPool();
    const [result] = await p.execute(sql, params);
    return result;
}

// ✅ 批量插入（已修复：保留字 + SQL安全）
async function batchInsert(table, columns, rows) {
    if (!rows || rows.length === 0) return [];

    // 给列名加反引号（防止 key / value 报错）
    const safeColumns = columns.map(col => `\`${col}\``).join(', ');

    // (?, ?, ?) 占位符
    const placeholders = rows
        .map(() => `(${columns.map(() => '?').join(', ')})`)
        .join(', ');

    // 扁平化参数
    const params = [];
    rows.forEach(row => {
        columns.forEach(col => {
            params.push(row[col] !== undefined ? row[col] : null);
        });
    });

    const sql = `INSERT INTO \`${table}\` (${safeColumns}) VALUES ${placeholders}`;

    return insert(sql, params);
}

// 通用条件查询构造器
function buildQuery(baseSQL, filters = {}, orderBy = '', limit = 50) {
    let sql = baseSQL;
    const params = [];
    const whereClauses = [];

    Object.entries(filters).forEach(([col, val]) => {
        if (val !== null && val !== undefined) {
            whereClauses.push(`\`${col}\` = ?`);
            params.push(val);
        }
    });

    if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    if (orderBy) {
        sql += ' ORDER BY ' + orderBy;
    }

    if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
    }

    return query(sql, params);
}

module.exports = {
    getPool,
    query,
    getOne,
    insert,
    batchInsert,
    buildQuery
};