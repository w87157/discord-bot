const { ActionRowBuilder } = require("discord.js");
const {
  buildHelpEmbed,
  buildHelpSelectMenu,
} = require("../Utils/helpUi");

module.exports = {
  name: "指令",
  description: "顯示指令總表選單",
  async execute(message) {
    const row = new ActionRowBuilder().addComponents(buildHelpSelectMenu());

    await message.reply({
      embeds: [buildHelpEmbed()],
      components: [row],
    });
  },
};
