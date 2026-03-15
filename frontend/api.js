const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://real-estate-crm.onrender.com";

function getToken(){
  return localStorage.getItem("crm_token");
}

function api(path){
  return API_BASE + path;
}

async function apiRequest(path, method="GET", body=null){

  const options = {
    method,
    headers:{
      "Content-Type":"application/json"
    }
  };

  const token=getToken();

  if(token){
    options.headers["Authorization"]="Bearer "+token;
  }

  if(body){
    options.body=JSON.stringify(body);
  }

  const res = await fetch(api(path),options);

  return res.json();
}