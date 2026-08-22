const cookieString = 'session_id=1234567890; HttpOnly; Path=/';
const match = cookieString.match(/session_id=([^;]+)/);
console.log(match ? match[1] : null);
