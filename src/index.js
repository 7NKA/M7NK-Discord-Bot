require("dotenv").config();

const Database = require("better-sqlite3");
const { MessageFlagsBitField, channelMention, roleMention, linkedRoleMention } = require("discord.js");
const db = new Database("database.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS AgeUsers (
        userId TEXT,
        guildId TEXT,
        username TEXT DEFAULT "",
        age INTEGER DEFAULT 0,
        PRIMARY KEY (guildId, userId)
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
    name: "الغاء_التوثيق",
    description: "الغاء التوثيق من شخص ما",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
      {
        name: "الهدف",
        type: ApplicationCommandOptionType.User,
        description: "قم بتحديد العضو المستهدف",
        required: true,
      }
    ],
  },
  {
    name: "حظر",
    description: "قم بحظر شخص ما من السيرفر",
    default_member_permissions: PermissionFlagsBits.BanMembers.toString(),
    options: [
      {
        name: "الهدف",
        description: "قم بتحديد العضو المستهدف",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "السبب",
        description: "سبب الباند",
        type: ApplicationCommandOptionType.String
      },
    ],
  },
  {
    name: "تنبيه",
    description: "قم بعمل منشن لرول معين",
    default_member_permissions: PermissionFlagsBits.MentionEveryone.toString(),
    options: [{
      name: "الرسالة",
      description: "اكتب رسالة مع المنشن",
      type: ApplicationCommandOptionType.String,
      max_length: 256,
      required: true,
    },
    {
      name: "الرتبة",
      description: "اختر الرتبة التي سيتم عمل منشن لها",
      type: ApplicationCommandOptionType.Role,
      required: true,
    }
]
  },
  {
    name: "البحث",
    description: "ابحث عن معلومات عضو موثق في السيرفر",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [{
        name: "الهدف",
        description: "قم بتحديد العضو المستهدف",
        type: ApplicationCommandOptionType.User,
        required: true,
    }]
  },
    {
    name: "ابحث_عن_جميع_الموثقين",
    description: "ابحث عن معلومات جميع الموثقين بالسيرفر",
    default_member_permissions: PermissionFlagsBits.Administrator.toString()
  }
];

const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);


(async () => {
    try {
        console.log('Registering slash commands...');
        const guildIds = process.env.GUILD_ID ? process.env.GUILD_ID.split(',').map(id => id.trim()) : [];

        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: commands }
            );
        }
        console.log('All slash commands have been registered successfully!');
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();

client.once("clientReady", async (c) => {
    console.log(`logged in as ${client.user.tag}`);
    client.user.setActivity("Niki minaj", {
        type: ActivityType.Listening
    });
});

// Ping role button message (تم إرجاعه كما كان)
client.on("messageCreate", async (msg) => {

    if (msg.content.startsWith(`ping`) && msg.mentions.roles.size > 0) {

    const roleId = msg.mentions.roles.first()
    if (!roleId) return;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`my_button-${roleId}`)
            .setLabel("🔔")
            .setStyle(ButtonStyle.Success)
    );
    
    msg.channel.send({
        embeds: [
          new EmbedBuilder()
          .setTitle(`__🔔${roleId.name} رتبة__`)
          .setDescription(`اذا كنت مهتم ان تصلك اخر اخبار السيرفر اضغط الزر ادناه للحصول على رتبة ${roleId}`)
          .setColor("Yellow")
        ],
        components: [row]
    });
    msg.delete().catch(() => {});

} else if (msg.content === `ping` && msg.mentions.roles.size === 0) {msg.channel.send({content: "❌يرجة عمل منشن لرتبة ال ping ضمن الرسالة \nمثال: `ping @اسم الرتبة `"})

    await msg.delete();

}
});

// Ping role intraction
client.on("interactionCreate", async (iny) => {
    if (!iny.isButton()) return;

    if (iny.customId.startsWith("my_button")) {
        const roleId = iny.customId.split("-")[1];
        const rawld = roleId.slice(3, -1);
      
        if (!iny.member.roles.cache.has(rawld)) {
            await iny.member.roles.add(rawld);
            await iny.reply({
                content: `🟢${roleId} لقد تم اضافة رتبة `,
                flags: MessageFlags.Ephemeral
            });
        } else {
            await iny.member.roles.remove(rawld);
            await iny.reply({
                content: `🔴${roleId} لقد تم ازالة رتبة `,
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

// ban slash command interaction
client.on("interactionCreate", async (int) => {
    if (!int.isChatInputCommand()) return;

    if (int.commandName === "حظر") {
        const user = int.options.getUser("الهدف", true);

        const member = await int.guild.members
            .fetch(user.id)
            .catch(() => null);


        if (!member) {
            return int.reply({
                content: "🤔 فشل العثور على المستخدم",
                flags: MessageFlags.Ephemeral
            });
        }


    
        if (member.id === int.user.id) {
            return int.reply({
                content: "❌ لا يمكنك حظر نفسك.",
                flags: MessageFlags.Ephemeral
            });
        }

        
        if (int.member.roles.highest.position <= member.roles.highest.position) {
            return int.reply({
                content: "❌لا يمكنك حظر هذا العضو",
                flags: MessageFlags.Ephemeral
            });
        }


        const botMember = int.guild.members.me;

        if (!botMember) {
            return int.reply({
                content: "❌ تعذر العثور على عضو البوت داخل السيرفر.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (botMember.roles.highest.position <= member.roles.highest.position) {
            return int.reply({
                content: "❌لا أستطيع حظر هذا العضو",
                flags: MessageFlags.Ephemeral
            });
        }

        
        if (!botMember.permissions.has("BanMembers")) {
            return int.reply({
                content: "❌ لا أملك صلاحية حظر الأعضاء.",
                flags: MessageFlags.Ephemeral
            });
        }

        const reason =
            int.options.getString("السبب") || "لم يتم تحديد السبب";

        const embed = new EmbedBuilder()
            .setTitle(`🚫 لقد تلقيت حظرًا في سيرفر ${int.guild.name}`)
            .addFields({
                name: "❓ السبب",
                value: "```" + reason + "```"
            })
            .setColor("White")
            .setAuthor({
                name: int.user.globalName || int.user.username,
                iconURL: int.user.avatarURL()
            })
            .setThumbnail(int.guild.iconURL())
            .setTimestamp();

        // إرسال رسالة خاصة قبل الحظر
        try {
            await member.send({ embeds: [embed] });
        } catch (err) {
            console.log(`Cannot send DM to ${member.user.tag}`);
        }

        // تنفيذ الحظر
        try {
            await member.ban({ reason });

            // حذف بيانات العضو من قاعدة البيانات
            db.prepare(`
                DELETE FROM AgeUsers
                WHERE userId = ?
            `).run(member.id);

            return int.reply({
                content: `✅ تم حظر ${member.user.tag}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (err) {
            console.error(err);

            return int.reply({
                content: "❌ حدث خطأ أثناء محاولة حظر العضو.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

// ping command interaction
const Users = new Map();

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "تنبيه") return;

    if (Users.has(interaction.user.id)) {
        return interaction.reply({
            content:'انتظر `10د` لعمل `تنبيه` اخر😡', 
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
        .setTitle(interaction.options.getString("الرسالة") || null);

    Users.set(interaction.user.id, true);

    try {
        await interaction.channel.send({
            content: `<@&${interaction.options.getRole("الرتبة").id}>`,
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

// search and sign system
client.on("messageCreate", async (msg) => {
    if (msg.content.startsWith("S&S") && msg.mentions.channels.size > 0) {

        msg.delete();

        const TextContainer = new TextDisplayBuilder()
            .setContent("# مرحبا بك!");

        const channelId = msg.mentions.channels.first();

        const TextContainer2 = new TextDisplayBuilder()
            .setContent(`## • يجب عليك توثيق نفسك للوصول لباقي القنوات\n## • لكن نرجوا أولاً الاطلاع على  ${channelId}`);

        const sparetor = new SeparatorBuilder();

        const DeleteButton = new ButtonBuilder()
            .setCustomId("Delete")
            .setEmoji("🗑️")
            .setLabel("الغاء التوثيق")
            .setStyle(ButtonStyle.Danger);

        const SearchButton = new ButtonBuilder()
            .setCustomId("MySelfSearch")
            .setEmoji("🔎")
            .setLabel("عرض معلوماتي")
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
                }
            ]);

        const ButtonRow = new ActionRowBuilder()
            .addComponents(DeleteButton, SearchButton);

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
    } else if (msg.content.startsWith("S&S") && msg.mentions.channels.size === 0) { msg.channel.send({content: "❌يرجة عمل منشن ل قناة القوانين ضمن الرسالة\n مثال: `S&S #اسم الروم`", flags: MessageFlags.Ephemeral} 


      )
       msg.delete();
    }
});

// Select Menu modals
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


client.on("interactionCreate", async (int) => {
    // Sign system
    if (int.customId === "SignModal") {
        const name = int.fields.getTextInputValue("name");
        const age = int.fields.getTextInputValue("age");

        const check = db.prepare(`
            SELECT * FROM AgeUsers
            WHERE userId = ? AND guildId = ?
        `).get(int.user.id, int.guild.id);

        if (check) {
            return int.reply({ content: "❌لقد توثقت بالفعل!", flags: MessageFlags.Ephemeral });
        }

        db.prepare(`
            INSERT INTO AgeUsers (username, age, userId, guildId)
            VALUES (?, ?, ?, ?)
        `).run(name, age, int.user.id, int.guild.id);
                    
        await int.reply({ content: "✅لقد تم توثيقك بنجاح", flags: MessageFlags.Ephemeral});
    }

    // Search system
    if (int.isChatInputCommand() && int.commandName === "البحث") {
        if (int.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const target = int.options.getMember("الهدف"); 

            if (target.user.bot) {return int.reply({content: "❌لا يمكنك البحث عن عن معلومات بوت", flags: MessageFlags.Ephemeral})}
          
            const user = db.prepare(`
                SELECT * FROM AgeUsers
                WHERE userId = ? AND guildId = ?
            `).get(target.user.id, int.guild.id);

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
                return int.reply({ content: "❌المستخدم ليس موثق", flags: MessageFlags.Ephemeral});
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

        if (user) {
            db.prepare(`
                UPDATE AgeUsers
                SET username = ?, age = ?
                WHERE userId = ? AND guildId = ?
            `).run(newname, newage, int.user.id, int.guild.id);

            await int.reply({ content: "✅تم تحديث معلوماتك بنجاح", flags: MessageFlags.Ephemeral });
        } else {
            await int.reply({ content: "❌يجب عليك توثيق نفسك قبل ذلك", flags: MessageFlags.Ephemeral });
        }
    }

    // Button interactions (Delete, MySelfSearch, AllSearch)

        if (int.customId === "Delete") {
            const user = db.prepare(`
                SELECT * FROM AgeUsers
                WHERE userId = ? AND guildId = ?
            `).get(int.user.id, int.guild.id); 

            if (user) {
                db.prepare(`
                    DELETE FROM AgeUsers
                    WHERE userId = ? AND guildId = ?
                `).run(int.user.id, int.guild.id);

                await int.reply({ content: "✅تم الغاء توثيقك بنجاح", flags: MessageFlags.Ephemeral });
            } else {
                await int.reply({ content: "❌لست موثقاً من الاساس", flags: MessageFlags.Ephemeral });
            }
        }

        if (int.customId === "MySelfSearch") {
            const user = db.prepare(`
                SELECT * FROM AgeUsers
                WHERE userId = ? AND guildId = ?
                AND username IS NOT NULL
                AND age IS NOT NULL
            `).get(int.user.id, int.guild.id);

            if (user) {
                await int.reply({
                    embeds: [new EmbedBuilder().setColor("White")
                        .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM4a3fRsnjuGAy4UjGdc3gj7FRBSQw3mg15T33a7ZIpQ&s=10")
                        .setTitle("__🧾معلوماتك__")
                        .addFields(
                            {name: "الاسم ", value: `${user.username}`},
                            {name: "العمر", value: `${user.age}`}
                        )
                    ], 
                    flags: MessageFlags.Ephemeral
                });
            }

        }

                if (int.commandName === "ابحث_عن_جميع_الموثقين") {
                const users = db.prepare(`
                    SELECT * FROM AgeUsers
                    WHERE guildId = ?
                `).all(int.guild.id);

                let memberList = "";

                users.forEach(user => {
                    memberList += `\n<@${user.userId}>\nname: ${user.username} \nage: ${user.age}\n`;
                });

                if (users.length > 0) {
                    const embed = new EmbedBuilder()
                        .setTitle("__👥كل الاعضاء الموثقين__")
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
                        .setDescription("👥لا اعضاء موثقين حتى الان");

                    await int.reply({ embeds: [embeda], flags: MessageFlags.Ephemeral });
                }
            } 
    
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "الغاء_التوثيق") {
       const target = interaction.options.getMember("الهدف");
       if (!target) {
           return interaction.reply({ content: `لم اعثر على العضو😔`, flags: MessageFlags.Ephemeral });
       }
       if (target.user.bot) {
           return interaction.reply({ content: "❌لا يمكنك ازالة التوثيق لبوت", flags: MessageFlags.Ephemeral });
       }

       const check = db.prepare(`SELECT * FROM AgeUsers
                                 WHERE userId = ? AND guildId = ?
                             `).get(target.user.id, interaction.guild.id);

       if (check) {
        db.prepare(`
            DELETE FROM AgeUsers
            WHERE userId = ? AND guildId = ?
        `).run(target.user.id, interaction.guild.id);

        interaction.reply({ content: `✅${target.user.username} تم ازالة التوثيق من`, flags: MessageFlags.Ephemeral });
       } else {
        interaction.reply({ content: `❌${target.user.username} ليس موثقا من الاساس`, flags: MessageFlags.Ephemeral });
       }
    }
});


// games 

client.on("messageCreate", (msg) => {

if (msg.content === "gam") {







    
}



})

client.login(process.env.TOKEN);
