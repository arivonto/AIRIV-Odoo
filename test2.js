const headers = new Headers();
headers.append('Set-Cookie', 'foo=bar; Path=/');
headers.append('Set-Cookie', 'session_id=abcdef; HttpOnly');
console.log(headers.getSetCookie());
