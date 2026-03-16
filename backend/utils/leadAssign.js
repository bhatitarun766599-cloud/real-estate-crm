async function getNextEmployee(pool) {

 const employees = await pool.query(
  "SELECT id FROM employees WHERE status='active' ORDER BY id"
 )

 const rotation = await pool.query(
  "SELECT last_employee_id FROM lead_rotation LIMIT 1"
 )

 let last = rotation.rows[0].last_employee_id

 let index = employees.rows.findIndex(e => e.id === last)

 let nextEmployee =
 employees.rows[(index + 1) % employees.rows.length].id

 await pool.query(
  "UPDATE lead_rotation SET last_employee_id=$1",
  [nextEmployee]
 )

 return nextEmployee
}

module.exports = getNextEmployee