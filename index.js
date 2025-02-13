require('dotenv').config();
const express = require('express');
const axios = require('axios');
const url = require('url');

const app = express();
const port = process.env.PORT || 10000;

app.get('/api/auth/discord/redirect', async (req, res) => {
    const { code } = req.query;
    console.log('работает');
    if (!code) {
        return res.status(400).send('Ошибка: не найден код авторизации.');
    }

    try {
        const formData = new url.URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code.toString(),
            redirect_uri: process.env.REDIRECT_URI,
        });

        const output = await axios.post('https://discord.com/api/v10/oauth2/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = output.data.access_token;

        // Получаем информацию о пользователе
        const userinfo = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log('Информация о пользователе:', userinfo.data);
        const guildId = process.env.GUILD_ID;
        const guildMember = await axios.get(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log('Информация о ролях пользователя:', guildMember.data.roles);
        if (guildMember.data.roles.includes(process.env.ROLE_ID)) {
            console.log(true);
            
        } else {
            console.log(false);
            
        }
        res.json({
            user: userinfo.data,
            guildMember: guildMember.data,
        });

    } catch (error) {
        console.error('Ошибка авторизации:', error.response ? error.response.data : error.message);
        res.status(500).send('Произошла ошибка авторизации.');
    }
});

// Вывод ссылки на авторизацию для тестирования
app.get('/auth/discord', (req, res) => {
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&scope=identify+guilds+guilds.members.read`;

    console.log('Авторизация по ссылке: ', authUrl);
    res.send(`Перейдите по следующей ссылке для авторизации: <a href="${authUrl}">${authUrl}</a>`);
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
