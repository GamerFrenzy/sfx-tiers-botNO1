const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");

// --- Discord bot token ---
const TOKEN = "MTQ2MDkzOTQ1MDA1Njk2NjI2Nw.GEkEOq.OxpVGEmZ_jt1YNCBMvhHfmlRtMXi12TkGyEA4g";

// --- Cloudflare Worker API URL ---
const API_URL = "https://sfxtiers.digitalarmy888.workers.dev/";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Tier detection logic
function getTierFromRoles(member) {
  let tier = "None";
  let roleName = "";
  let gameMode = "";

  member.roles.cache.forEach(role => {
    const r = role.name.toLowerCase();

    // Check tier
    if (r.includes("ht1")) { tier = "HT1"; roleName = role.name; }
    else if (r.includes("lt1")) { tier = "LT1"; roleName = role.name; }
    else if (r.includes("ht2")) { tier = "HT2"; roleName = role.name; }
    else if (r.includes("lt2")) { tier = "LT2"; roleName = role.name; }
    else if (r.includes("ht3")) { tier = "HT3"; roleName = role.name; }
    else if (r.includes("lt3")) { tier = "LT3"; roleName = role.name; }
    else if (r.includes("ht4")) { tier = "HT4"; roleName = role.name; }
    else if (r.includes("lt4")) { tier = "LT4"; roleName = role.name; }
    else if (r.includes("ht5")) { tier = "HT5"; roleName = role.name; }
    else if (r.includes("lt5")) { tier = "LT5"; roleName = role.name; }

    // Check game mode (example: Crystal, SFX, whatever prefix before tier)
    if (r.includes("crystal")) gameMode = "Crystal";
    else if (r.includes("sfx")) gameMode = "SFX";
    else if (!gameMode) gameMode = "Unknown"; // default
  });

  return { tier, roleName, gameMode };
}

client.on("ready", () => {
  console.log(`Bot is online! Logged in as ${client.user.tag}`);
});

// Auto update API on role change
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const { tier, roleName, gameMode } = getTierFromRoles(newMember);

    // Send to Cloudflare Worker API
    await fetch(`${API_URL}?discord_id=${newMember.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, roleName, gameMode })
    });

    console.log(`Updated ${newMember.user.tag}: ${tier} | ${roleName} | ${gameMode}`);
  } catch (err) {
    console.error("Error updating tier:", err);
  }
});

// Manual command to check tier
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!tier")) {
    const { tier, roleName, gameMode } = getTierFromRoles(message.member);
    message.reply(`Your tier is: ${tier}\nRole: ${roleName}\nGame Mode: ${gameMode}`);
  }
});

client.login(TOKEN);
