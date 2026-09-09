require("dotenv").config();

const Database = require("better-sqlite3");
const { MessageFlagsBitField } = require("discord.js");
const db = new Database("database.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS AgeUsers (
        userId TEXT PRIMARY KEY,
        username TEXT DEFAULT "",
        age INTEGER DEFAULT 0
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS allready (
        userId TEXT PRIMARY KEY
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS BannedUsers (
        userId TEXT PRIMARY KEY
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS Regected (
        userId TEXT PRIMARY KEY
    )
`).run();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ActivityType,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    REST,
    Routes,
    ApplicationCommandOptionType,
    MessageFlags,
    TextDisplayBuilder,
    SeparatorBuilder,
    ContainerBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const commands = [
  {
    name: "unverify",
    description: "Un verify someone",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
      {
        name: "target",
        type: ApplicationCommandOptionType.Mentionable,
        description: "the target user to un verify",
        required: true,
      }
    ],
  },
  {
    name: "ban",
    description: "Ban someone",
    default_member_permissions: PermissionFlagsBits.BanMembers.toString(),
    options: [
      {
        name: "usermention",
        description: "hi",
        type: ApplicationCommandOptionType.Mentionable,
        required: true,
      },
      {
        name: "reason",
        description: "give a reason for the ban",
        type: ApplicationCommandOptionType.String
      },
    ],
  },
  {
    name: "ping",
    description: "mention the ping role",
    default_member_permissions: PermissionFlagsBits.MentionEveryone.toString(),
    options: [{
      name: "message",
      description: "send a message with the ping",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "role",
      description: "chose the role to ping",
      type: ApplicationCommandOptionType.Role,
      required: true,
    }


]
  }
];

const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);

(async () => {
   try {
     console.log('Registring slash commands...');
     await rest.put(
       Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
       { body: commands }
     );
     console.log('slash commands has registred successfully!');
   } catch (error) {
     console.log(`there was a error the error was: ${error}`);
   } 
})();

client.once("clientReady", (c) => {
    console.log(`logged in as ${client.user.tag}`);
    client.user.setActivity("Niki minaj", {
        type: ActivityType.Listening
    });
});

// Ping role button message
client.on("messageCreate", (msg) => {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("my_button")
            .setLabel("🔔")
            .setStyle(ButtonStyle.Success)
    );
    
    if (msg.content === "button") {
        msg.channel.send({
            embeds: [
              new EmbedBuilder()
              .setTitle("__🔔ping رتبة__")
              .setDescription('<اذا كنت مهتم انت تصلك اخر اخبار السيرفر اضغط الزر ادناه للحصول على رتبة <1521643199943282851@&')
              .setColor("Yellow")
            ],
            components: [row]
        });
        msg.delete().catch(() => {});
    }
});

// Ping role give and remove from user
client.on("interactionCreate", async (iny) => {
    if (!iny.isButton()) return;

    if (iny.customId === "my_button") {
        const roleId = "1521643199943282851";

        if (!iny.member.roles.cache.has(roleId)) {
            await iny.member.roles.add(roleId);
            await iny.reply({
                content: `🔔<@&1521643199943282851> لقد تم اضافة رتبة `,
               flags: MessageFlags.Ephemeral
            });
        } else {
            await iny.member.roles.remove(roleId);
            await iny.reply({
                content: `🔕<@&1521643199943282851> لقد تم ازالة رتبة `,
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

// ban slash command interaction
client.on("interactionCreate", async (int) => { 
    if (!int.isChatInputCommand()) return;
    if (int.commandName === "ban") {
        let member = int.options.getMember("usermention");

        if (!member) {
            return int.reply({
                content: "🤔لم اعثر على المستخدم",
              flags: MessageFlags.Ephemeral
            });
        }

        let reason = int.options.getString("reason") || "لم يتم تحديد السبب";

        let embed = new EmbedBuilder()
            .setTitle(`__🚫لقد تلقيت للتو حظر في سيرفر ${int.guild.name} server__`)
            .addFields({name: "__❓السبب__", value: "```" + reason + "```"})
            .setColor("White")
            .setAuthor({name: int.user.globalName, iconURL: int.user.avatarURL()})
            .setThumbnail(int.guild.iconURL())
            .setTimestamp();

        try {
            await member.send({ embeds: [embed] });
        } catch (err) {
            console.log(`Cannot send DM to ${member.user.tag}`);
        }

        await member.ban({ reason });

        await int.reply({
            content: `✅ تم حظر ${member.user.tag}`,
           flags: MessageFlags.Ephemeral
        });

        db.prepare(`
            DELETE FROM AgeUsers
            WHERE userId = ?
        `).run(member.user.id);
    }
});

// ping system
const Users = new Map();

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "ping") return;

    if (Users.has(interaction.user.id)) {
        return interaction.reply({
            content:'انتظر `10m` لعمل `ping` اخر😡', 
            flags: MessageFlags.Ephemeral
        });
    }

    const embed4 = new EmbedBuilder()
        .setAuthor({
            name: interaction.member.displayName,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setFooter({text: "🔔pinged by" + " " + interaction.user.username})
        .setTimestamp()
        .setColor("Yellow")
        .setTitle(interaction.options.getString("message") || null);

    Users.set(interaction.user.id, true);

    try {
        await interaction.channel.send({
            content: `<@&${interaction.options.getRole("role").id}>`,
            embeds: [embed4]
        });

        await interaction.reply({
            content: "تم عمل بينغ بنجاح!",
            flags: MessageFlags.Ephemeral
        });

        await new Promise(resolve => setTimeout(resolve, 600000));
        
        await interaction.user.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`__🥳يمكنك عمل بينغ الان! ${interaction.guild} server__`)
                    .setDescription("**[اذهب للسيرفر](https://discord.gg/8EvubxT5)**")
                    .setThumbnail(interaction.guild.iconURL())
                    .setColor("Green")
                    .setTimestamp()
            ]
        });
    } finally {
        Users.delete(interaction.user.id);
    }
});

// search and sign system UI message (Using Container Components V2)
client.on("messageCreate", async (msg) => {
    if (msg.content === "S&S") {
        const TextContainer = new TextDisplayBuilder()
            .setContent("# مرحبا بك!");

        const TextContainer2 = new TextDisplayBuilder()
            .setContent("## • يجب عليك توثيق نفسك للوصول لباقي القنوات\n## • لكن نرجوا أولاً الاطلاع على الـ <#1544326222769561600>");

        const sparetor = new SeparatorBuilder();

        const DeleteButton = new ButtonBuilder()
            .setCustomId("Delete")
            .setEmoji("🗑️")
            .setLabel("حذف معلوماتي")
            .setStyle(ButtonStyle.Danger);

        const SearchButton = new ButtonBuilder()
            .setCustomId("MySelfSearch")
            .setEmoji("🔎")
            .setLabel("عرض معلوماتي")
            .setStyle(ButtonStyle.Primary);

        const SearchAllButton = new ButtonBuilder()
            .setCustomId("AllSearch")
            .setEmoji("👥")
            .setLabel("عرض معلومات جميع الاعضاء")
            .setStyle(ButtonStyle.Primary);

        const selectMenus = new StringSelectMenuBuilder()
            .setCustomId("menu")
            .setPlaceholder("اختر!")
            .addOptions([
                {
                    label: "التوثيق",
                    description: "قم بتوثيق نفسك",
                    value: "1",
                    emoji: "✅"
                },
                {
                    label: "حدث معلوماتك",
                    description: "قم بتحديث معلوماتك القديمة",
                    value: "2",
                    emoji: "🔃"
                },
                {
                    label: "ابحث عن شخص",
                    description: "قم بالبحث عن معلومات شخص ما",
                    value: "3",
                    emoji: "🔎"
                },
            ]);

        const ButtonRow = new ActionRowBuilder()
            .addComponents(DeleteButton, SearchButton, SearchAllButton);

        const SelectRow = new ActionRowBuilder()
            .addComponents(selectMenus);

        const Container = new ContainerBuilder()
            .addTextDisplayComponents(TextContainer)
            .addSeparatorComponents(sparetor)
            .addTextDisplayComponents(TextContainer2)
            .addSeparatorComponents(sparetor)
            .addActionRowComponents(SelectRow)
            .addSeparatorComponents(sparetor)
            .addActionRowComponents(ButtonRow);

        await msg.channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [Container]
        });

        msg.delete().catch(() => {});
    }
});

// Select Menu modals trigger
client.on("interactionCreate", async (int) => {
    if (int.isStringSelectMenu() && int.customId === "menu") {
        const choice = int.values[0];

        if (choice === "1") {
            const modal = new ModalBuilder()
                .setCustomId("SignModal")
                .setTitle("ادخل معلوماتك🔽");

            const NameInput = new TextInputBuilder()
                .setCustomId("name")
                .setLabel("الاسم")
                .setPlaceholder("مثال : حسام")
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            const AgeInput = new TextInputBuilder()
                .setCustomId("age")
                .setLabel("العمر")
                .setPlaceholder("مثال : 18")
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(NameInput),
                new ActionRowBuilder().addComponents(AgeInput)
            );

            await int.showModal(modal);
        }

        if (choice === "3") {
            const modal = new ModalBuilder()
                .setCustomId("SearchModal")
                .setTitle("ابحث عن شخص🔽");

            const idInput = new TextInputBuilder()
                .setCustomId("id")
                .setLabel("Id")
                .setPlaceholder("مثال : 11537238294204")
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            modal.addComponents(new ActionRowBuilder().addComponents(idInput));
            await int.showModal(modal);
        }

        if (choice === "2") {
            const modal = new ModalBuilder()
                .setCustomId("UpdateModal")
                .setTitle("حدث معلوماتك🔽");

            const NewNameInput = new TextInputBuilder()
                .setCustomId("NewName")
                .setLabel("غير الاسم")
                .setPlaceholder("مثال : حسام")
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            const NewAgeInput = new TextInputBuilder()
                .setCustomId("NewAge")
                .setLabel("غير العمر")
                .setPlaceholder("مثال : 18")
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(NewNameInput),
                new ActionRowBuilder().addComponents(NewAgeInput)
            );

            await int.showModal(modal);
        }
    }
});

// Modal Submits & Buttons handler
client.on("interactionCreate", async (int) => {
    if (int.isModalSubmit()) {
        // Sign system
        if (int.customId === "SignModal") {
            const name = int.fields.getTextInputValue("name");
            const age = int.fields.getTextInputValue("age");

            const check = db.prepare(`
                SELECT * FROM AgeUsers
                WHERE userId = ?
            `).get(int.user.id);

            if (check) {
                return int.reply({ content: "❌لقد توثقت بالفعل!", flags: MessageFlags.Ephemeral });
            }

            db.prepare(`
                INSERT INTO AgeUsers (username, age, userId)
                VALUES (?, ?, ?)
            `).run(name, age, int.user.id);

            try {
                await int.member.roles.add("1520422545721921627");
            } catch (e) {
                console.log("Could not add role to member.");
            }
                        
            await int.reply({ content: "✅لقد تم توثيقك بنجاح", flags: MessageFlags.Ephemeral});
        }

        // Search system
        if (int.customId === "SearchModal") {
            if (int.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const idInput = int.fields.getTextInputValue("id"); 

                const user = db.prepare(`
                    SELECT * FROM AgeUsers
                    WHERE userId = ?
                `).get(idInput);

                if (user) {
                    return int.reply({
                        embeds: [new EmbedBuilder().setColor("White")
                            .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM4a3fRsnjuGAy4UjGdc3gj7FRBSQw3mg15T33a7ZIpQ&s=10")
                            .setTitle("__🧾معلومات المستخدم__")
                            .addFields(
                                {name: "الاسم", value: `${user.username}`},
                                {name: "العمر", value: `${user.age}`}
                            )
                        ], 
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    return int.reply({ content: "❌لم اعثر على المستخدم", flags: MessageFlags.Ephemeral});
                }
            } else {
                return int.reply({ content: "❌لا تمتلك الصلاحية لهذا", flags: MessageFlags.Ephemeral });
            }
        }

        // Update info system
        if (int.customId === "UpdateModal") {
            const newname = int.fields.getTextInputValue("NewName");
            const newage = int.fields.getTextInputValue("NewAge");

            const user = db.prepare(`
                SELECT * FROM AgeUsers
                WHERE userId = ?
            `).get(int.user.id);

            if (user && int.member.roles.cache.has("1520422545721921627")) {
                db.prepare(`
                    UPDATE AgeUsers
                    SET username = ?, age = ?
                    WHERE userId = ?
                `).run(newname, newage, int.user.id);

                await int.reply({ content: "✅تم تحديث معلوماتك بنجاح", flags: MessageFlags.Ephemeral });
            } else {
                await int.reply({ content: "❌لا تمتلك معلومات لتحديثها", flags: MessageFlags.Ephemeral });
            }
        }
    }

    // Button interactions (Delete, MySelfSearch, AllSearch)
    if (int.isButton()) {
        // Delete info system
        if (int.customId === "Delete") {
            const user = db.prepare(`
                SELECT * FROM AgeUsers
                WHERE userId = ?
            `).get(int.user.id); 

            if (user && int.member.roles.cache.has("1520422545721921627")) {
                db.prepare(`
                    DELETE FROM AgeUsers
                    WHERE userId = ?
                `).run(int.user.id);

                db.prepare(` 
                    INSERT OR IGNORE INTO BannedUsers (userId)
                    VALUES (?)
                `).run(int.user.id);
                
                await int.member.roles.remove("1520422545721921627").catch(() => {});

                await int.reply({ content: "✅تم حذف معلوماتك بنجاح", flags: MessageFlags.Ephemeral });
            } else {
                await int.reply({ content: "❌لا تمتلك معلومات لحذفها", flags: MessageFlags.Ephemeral });
            }
        }

        // Self Search system
        if (int.customId === "MySelfSearch") {
            const user = db.prepare(`
                SELECT * FROM AgeUsers
                WHERE userId = ? 
                AND username IS NOT NULL
                AND age IS NOT NULL
            `).get(int.user.id);

            if (user) {
                await int.reply({
                    embeds: [new EmbedBuilder().setColor("White")
                        .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM4a3fRsnjuGAy4UjGdc3gj7FRBSQw3mg15T33a7ZIpQ&s=10")
                        .setTitle("__🧾معلوماتك__")
                        .addFields(
                            {name: "الاسم", value: `${user.username}`},
                            {name: "العمر", value: `${user.age}`}
                        )
                    ], 
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await int.reply({ content: "❌لم اعثر على معلومات تتعلق بك", flags: MessageFlags.Ephemeral });
            }
        }

        // Search all system
        if (int.customId === "AllSearch") {
            if (int.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const users = db.prepare(`
                    SELECT * FROM AgeUsers
                `).all();

                let memberList = "";
                let number = 0;

                users.forEach(user => {
                    number += 1; 
                    memberList += `\n<@${user.userId}>\nname: ${user.username} \nage: ${user.age}\n`;
                });

                if (users.length > 0) {
                    const embed = new EmbedBuilder()
                        .setTitle("__👥كل الاعضاء__")
                        .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM4a3fRsnjuGAy4UjGdc3gj7FRBSQw3mg15T33a7ZIpQ&s=10")
                        .setColor("White")
                        .addFields({
                            name: "الاعضاء👥", 
                            value: memberList.length > 1024 ? memberList.slice(0, 1021) + "..." : memberList
                        });

                    await int.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                } else {
                    const embeda = new EmbedBuilder()
                        .setColor("White")
                        .setDescription("👥لا اعضاء حتى الان");

                    await int.reply({ embeds: [embeda], flags: MessageFlags.Ephemeral });
                }
            } else {
                await int.reply({ content: "❌انت لا تمتلك الصلاحية", flags: MessageFlags.Ephemeral });
            }
        }
    }
});

client.on("interactionCreate", async (interaction) => {

    if (interaction.commandName === "unverify") {

       const target = interaction.options.getMember("target")

       const check = db.prepare(`SELECT * FROM AgeUsers
                                 WHERE userId = ?
                             `).run(target.user.id)

       if (check && target) {

        db.prepare(`
            DELETE FROM AgeUsers
            WHERE userId = ?
        `).run(target.user.id);

        interaction.reply({content:`✅${target.user.username} تم ازالة التوثيق من`, flags: MessageFlags.Ephemeral})

       } else if (!check) {interaction.reply({content:`❌${target.user.username} ليس موثقا من الاساس`, flags: MessageFlags.Ephemeral })
    
    } else if (!target) {interaction.reply({content: `لم اعثر على العضو😔`, flags: MessageFlags.Ephemeral
    })}
    }



})

client.login(process.env.TOKEN);
