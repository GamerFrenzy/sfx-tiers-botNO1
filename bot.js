const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require("discord.js");
const fetch = require("node-fetch");

// ===== Config =====
const TOKEN = "YOUR_BOT_TOKEN_HERE";
const GUILD_ID = "YOUR_GUILD_ID_HERE";
const CLIENT_ID = "YOUR_CLIENT_ID_HERE";
const API_URL = "https://sfxtiers.digitalarmy888.workers.dev/";

// Example verification codes
const verificationCodes = {
  "ABC123": "HT1",
  "DEF456": "LT1",
  "GHI789": "HT2"
  // Add more code: tier mapping as needed
};

// ===== Discord Client =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== Tier detection from roles (dynamic) =====
function getTierFromRoles(member) {
  let tier = "None";
  let roleName = "";
  let gameMode = "Unknown";

  member.roles.cache.forEach(role => {
    const r = role.name.toLowerCase();

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

    if (r.includes("crystal")) gameMode = "Crystal";
    else if (r.includes("sfx")) gameMode = "SFX";
  });

  return { tier, roleName, gameMode };
}

// ===== Update Cloudflare API =====
async function updateTierAPI(discordId, tier, roleName, gameMode) {
  try {
    await fetch(`${API_URL}?discord_id=${discordId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, roleName, gameMode })
    });
    console.log(`API updated: ${tier} | ${roleName} | ${gameMode}`);
  } catch (err) {
    console.error("Error updating API:", err);
  }
}

// ===== Bot Ready =====
client.once("ready", async () => {
  console.log(`Bot online as ${client.user.tag}`);

  // Register /verify slash command with optional code parameter
  const commands = [
    new SlashCommandBuilder()
      .setName("verify")
      .setDescription("Verify yourself with a code")
      .addStringOption(option =>
        option.setName("code")
          .setDescription("Verification code")
          .setRequired(true)
      )
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Slash command /verify registered!");
});

// ===== Auto-update API on role changes =====
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const { tier, roleName, gameMode } = getTierFromRoles(newMember);
    await updateTierAPI(newMember.id, tier, roleName, gameMode);
    console.log(`Updated ${newMember.user.tag}: ${tier} | ${roleName} | ${gameMode}`);
  } catch (err) {
    console.error("Error updating tier:", err);
  }
});

// ===== Handle /verify command =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "verify") {
    const code = interaction.options.getString("code");
    const tierFromCode = verificationCodes[code];

    if (!tierFromCode) {
      await interaction.reply({ content: "Invalid verification code!", ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);

    // Assign role based on tier
    const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === tierFromCode.toLowerCase());
    if (role) {
      await member.roles.add(role);
    }

    // Update API
    const { tier, roleName, gameMode } = getTierFromRoles(member);
    await updateTierAPI(member.id, tier, roleName, gameMode);

    await interaction.reply({ content: `✅ Verified! Your tier: ${tier}, Role: ${roleName}, Game Mode: ${gameMode}`, ephemeral: true });
  }
});

// ===== Manual tier check =====
client.on("messageCreate", async message => {
  if (message.content.startsWith("!tier")) {
    const { tier, roleName, gameMode } = getTierFromRoles(message.member);
    message.reply(`Your tier: ${tier}\nRole: ${roleName}\nGame Mode: ${gameMode}`);
  }
});

// ===== Login Bot =====
client.login(TOKEN);
