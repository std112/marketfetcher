const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const STEAM_API_KEY = '';

app.use(cors());
app.use(express.json());

async function resolveSteamID(input) {
  if (/^\d{17}$/.test(input)) return input;

  // Try resolving vanity URL
  const res = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${input}`);
  const data = await res.json();
  if (data.response.success === 1) {
    return data.response.steamid;
  }
  return null;
}

app.post('/api/steamProfile', async (req, res) => {
  const input = req.body.input;
  if (!input) return res.status(400).json({ error: 'No input provided' });

  const cleanedInput = input.replace(/(https?:\/\/)?steamcommunity\.com\/(id|profiles)\//, '').replace(/\/$/, '');
  const steamId = await resolveSteamID(cleanedInput);
  if (!steamId) return res.status(404).json({ error: 'Could not resolve Steam ID' });

  try {
    const profileRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`);
    const profileData = await profileRes.json();
    const player = profileData.response.players[0];
    if (!player) return res.status(404).json({ error: 'Player not found' });

    res.json({
      name: player.personaname,
      avatar: player.avatarfull
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Steam API error' });
  }
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));



