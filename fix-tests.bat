@echo off
chcp 65001 >nul
cd /d D:\vibe-project

:: login.test.js
echo const { main } = require('../cloudfunctions/login');> tests\login.test.js
echo.>> tests\login.test.js
echo describe('login', () => {>> tests\login.test.js
echo   test('creates a new user on first login', async () => {>> tests\login.test.js
echo     const result = await main({}, {});>> tests\login.test.js
echo     expect(result.data.user).toBeDefined();>> tests\login.test.js
echo     expect(result.data.user.openid).toBe('mock-openid-123');>> tests\login.test.js
echo     expect(result.data.user.nickname).toBe('微信用户');>> tests\login.test.js
echo     expect(result.data.user.createdAt).toBeDefined();>> tests\login.test.js
echo   });>> tests\login.test.js
echo.>> tests\login.test.js
echo   test('returns existing user on subsequent login', async () => {>> tests\login.test.js
echo     await main({}, {});>> tests\login.test.js
echo     const result = await main({}, {});>> tests\login.test.js
echo     expect(result.data.user.openid).toBe('mock-openid-123');>> tests\login.test.js
echo   });>> tests\login.test.js
echo.>> tests\login.test.js
echo   test('returns same user id on repeated calls', async () => {>> tests\login.test.js
echo     const first = await main({}, {});>> tests\login.test.js
echo     const second = await main({}, {});>> tests\login.test.js
echo     expect(first.data.user._id).toBe(second.data.user._id);>> tests\login.test.js
echo   });>> tests\login.test.js
echo });>> tests\login.test.js

echo login.test.js done