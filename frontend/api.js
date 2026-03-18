const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://real-estate-crm-cxtj.onrender.com";


/* ===============================
   TOKEN HANDLING
================================ */

function getToken(){
  return localStorage.getItem("token"); // unified
}

function setToken(token){
  localStorage.setItem("token", token);
}

function logout(){
  localStorage.removeItem("token");
  window.location.href = "login.html";
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

    const token = getToken();

    if(token){
      options.headers["Authorization"] = "Bearer " + token;
    }

    if(body){
      options.body = JSON.stringify(body);
    }

    const res = await fetch(api(path), options);

    // Handle unauthorized
    if(res.status === 401){
      logout();
      return;
    }

    const data = await res.json();

    return data;

  }catch(err){

    console.error("API Error:", err);
    alert("Something went wrong");

  }
}