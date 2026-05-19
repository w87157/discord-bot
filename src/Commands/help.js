const {
  buildHelpEmbed,
  buildHelpComponents,
} = require("../Utils/helpUi");

module.exports = {
  name: "指令",
  description: "顯示指令總表選單",
  async execute(message) {
    await message.reply({
      embeds: [buildHelpEmbed()],
      components: buildHelpComponents(),
    });
  },
};
