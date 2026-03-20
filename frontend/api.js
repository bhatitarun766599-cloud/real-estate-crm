const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://real-estate-crm-cxtj.onrender.com";

/* ===============================
   TOKEN HANDLING
================================ */

function getToken(){
  return localStorage.getItem("token");
}

function setToken(token){
  localStorage.setItem("token", token);
}

function logout(){
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/* ===============================
   USER HANDLING
================================ */

function setUser(user){
  localStorage.setItem("user", JSON.stringify(user));
}

function getUser(){
  return JSON.parse(localStorage.getItem("user"));
}

function getRole(){
  const user = getUser();
  return user?.role || null;
}

/* ===============================
   API BUILDER
================================ */

function api(path){
  return API_BASE + path;
}

/* ===============================
   MAIN REQUEST FUNCTION
================================ */

async function apiRequest(path, method="GET", body=null){

  try{

    const options = {
      method,
      headers:{
        "Content-Type":"application/json"
      }
    };

    const token = localStorage.getItem("token");

    if(token){
      options.headers["Authorization"] = "Bearer " + token;
    }

    if(body){
      options.body = JSON.stringify(body);
    }

    const res = await fetch(API_BASE + path, options);

    // 🔥 IMPORTANT FIX
    if(res.status === 401){
      console.log("Unauthorized → clearing token");
      localStorage.removeItem("token");
      return null; // ❌ NO redirect
    }

    return await res.json();

  }catch(err){
    console.error("API Error:", err);
    return null;
  }
}

/* ===============================
   LOGIN FUNCTION
================================ */

async function loginUser(email, password){

  const res = await apiRequest("/auth/login", "POST", {
    email,
    password
  });

  if(res && res.token){

    setToken(res.token);
    setUser(res.user);

    // 🔥 Role based redirect
    if(res.user.role === "manager"){
      window.location.href = "dashboard.html";
    }else{
      window.location.href = "employee-dashboard.html";
    }

  }else{
    alert(res?.error || "Login failed");
  }
}

/* ===============================
   PROTECT PAGE (AUTO CHECK)
================================ */

async function apiRequest(path, method="GET", body=null){

  try{

    const options = {
      method,
      headers:{
        "Content-Type":"application/json"
      }
    };

    const token = localStorage.getItem("token");

    if(token){
      options.headers["Authorization"] = "Bearer " + token;
    }

    if(body){
      options.body = JSON.stringify(body);
    }

    const res = await fetch(API_BASE + path, options);

    // 🔥 IMPORTANT FIX
    if(res.status === 401){
      console.log("Unauthorized → clearing token");
      localStorage.removeItem("token");
      return null; // ❌ NO redirect
    }

    return await res.json();

  }catch(err){
    console.error("API Error:", err);
    return null;
  }
}
/* ===============================
   ROLE BASE PAGE CONTROL
================================ */

function requireManager(){

  const role = getRole();

  if(role !== "manager"){
    alert("Access denied");
    window.location.href = "employee-dashboard.html";
  }
}

function requireEmployee(){

  const role = getRole();

  if(role !== "employee"){
    window.location.href = "dashboard.html";
  }
}