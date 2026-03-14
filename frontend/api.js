const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://real-estate-crm.onrender.com";


// GET TOKEN
function getToken(){
  return localStorage.getItem("crm_token");
}


// GENERATE API URL
function api(path){
  return API_BASE + path;
}


// GENERIC API REQUEST
async function apiRequest(path, method="GET", body=null){

  const options = {
    method: method,
    headers: {
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

  if(!res.ok){
    throw new Error("API request failed");
  }

  return res.json();
}