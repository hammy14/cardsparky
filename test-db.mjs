import mysql from 'mysql2/promise'

const conn = await mysql.createConnection({
  host: '72.167.125.133',
  user: 'TexSparky',
  password: 'Sparky#2020',
  database: 'Baseball',
  port: 3306
})

const [rows] = await conn.query('SELECT 1')
console.log('Connected!', rows)
await conn.end()
