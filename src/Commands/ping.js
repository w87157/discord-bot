const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("測試機器人延遲"),

  async execute(interaction) {
    await interaction.reply("Pong! 🏓");
  },
};
