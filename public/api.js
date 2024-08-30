
const BaseUrl = process.env.VITE_API_BASE_URL

const url =   BaseUrl || "https://script.google.com/macros/s/AKfycby3O54HpbuQFGmUX4M6DEqXcpZKwaKJgqY6J1K4d9muQgswnRfwkGnKge0vBA_E4L_Ryg/exec";
// console.log(url, 'env url');

export default url;
