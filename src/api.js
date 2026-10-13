const TOKEN_KEY='pulse_token';
export const getToken=()=>localStorage.getItem(TOKEN_KEY);
export const setToken=t=>t?localStorage.setItem(TOKEN_KEY,t):localStorage.removeItem(TOKEN_KEY);
export async function request(path,{method='GET',body}={}) {
 const response=await fetch(`/api${path}`,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(getToken()?{Authorization:`Bearer ${getToken()}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(response.status===204)return null;
 let json;try{json=await response.json();}catch{throw new Error('ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์');}
 if(!response.ok)throw new Error(json.error||'มีข้อผิดพลาดเกิดขึ้น');
 return json.data;
}
