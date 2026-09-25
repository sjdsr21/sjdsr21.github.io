// Anónimo y separado de la conversación: borrar el chat no reinicia el cupo.
let deviceId;
export function getDeviceId(){
 if(deviceId)return deviceId;
 try{deviceId=localStorage.getItem('ago-chat-device-v1');}catch{}
 if(!/^[a-f0-9-]{36}$/i.test(deviceId||'')){
  deviceId=crypto.randomUUID();try{localStorage.setItem('ago-chat-device-v1',deviceId);}catch{}
 }
 return deviceId;
}
