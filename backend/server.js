const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const authRoutes = require("./routes/auth");
const leadRoutes = require("./routes/leads");
const employeeRoutes = require("./routes/employees");

const app = express();

/* ===============================
   MIDDLEWARE
================================ */

app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());

/* ===============================
   DATABASE
================================ */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
.then(()=> console.log("PostgreSQL Connected ✅"))
.catch(err=> console.error("DB Connection Error ❌",err));


/* ===============================
   ROUND ROBIN EMPLOYEE
================================ */

async function getNextEmployee(){

 const employees = await pool.query(
  "SELECT id FROM employees WHERE status='active' ORDER BY id"
 );

 if(employees.rows.length === 0){
  throw new Error("No active employees found");
 }

 const rotation = await pool.query(
  "SELECT last_employee_id FROM lead_rotation LIMIT 1"
 );

 let last = rotation.rows[0]?.last_employee_id || null;

 let index = employees.rows.findIndex(e => e.id === last);

 let nextEmployee =
 employees.rows[(index + 1) % employees.rows.length].id;

 await pool.query(
  "UPDATE lead_rotation SET last_employee_id=$1",
  [nextEmployee]
 );

 return nextEmployee;
}


/* ===============================
   FACEBOOK WEBHOOK VERIFY
================================ */

const VERIFY_TOKEN = "crm_webhook_verify";

app.get("/webhook/facebook",(req,res)=>{

 const mode = req.query["hub.mode"];
 const token = req.query["hub.verify_token"];
 const challenge = req.query["hub.challenge"];

 if(mode === "subscribe" && token === VERIFY_TOKEN){
  console.log("Webhook Verified ✅");
  return res.status(200).send(challenge);
 }else{
  console.log("Webhook Verify Failed ❌");
  return res.sendStatus(403);
 }

});


/* ===============================
   FACEBOOK LEAD RECEIVE
================================ */

app.post("/webhook/facebook", async (req,res)=>{

 try{

  console.log("📩 Webhook Hit:", JSON.stringify(req.body, null, 2));

  const entry = req.body.entry;

  if(!entry || entry.length === 0){
   return res.sendStatus(200);
  }

  const changes = entry[0].changes;

  if(!changes || changes.length === 0){
   return res.sendStatus(200);
  }

  const leadData = changes[0].value;

  let name = "";
  let phone = "";

  if(leadData.field_data){

   leadData.field_data.forEach(field=>{

     if(field.name === "full_name"){
      name = field.values?.[0] || "";
     }

     if(field.name === "phone_number"){
      phone = field.values?.[0] || "";
     }

   });

  }

  console.log("Parsed Lead:", { name, phone });

  const employee = await getNextEmployee();

  await pool.query(
    "INSERT INTO leads (name,phone,source,assigned_to) VALUES ($1,$2,$3,$4)",
    [name,phone,"facebook_ads",employee]
  );

  console.log("✅ New Facebook Lead Saved");

  return res.sendStatus(200);

 }catch(err){

  console.error("❌ Webhook Error:",err);
  return res.sendStatus(500);

 }

});


/* ===============================
   ROUTES
================================ */

app.use("/auth", authRoutes);
app.use("/leads", leadRoutes);
app.use("/employees", employeeRoutes);


/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (req,res)=>{
 res.send("Real Estate CRM API Running 🚀");
});


/* ===============================
   SERVER START
================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
 console.log(`CRM Server running on port ${PORT}`);
});