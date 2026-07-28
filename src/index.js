require("dotenv").config();


const Datebase = require("better-sqlite3");

const db = new Datebase("datebase.db");


db.prepare(`
    CREATE TABLE IF NOT EXISTS AgeUsers (
    
    userId TEXT PRIMARY KEY,
    username TEXT DEFAULT "",
    age INTEGER DEFAULT 0
    
)
    

    `).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS BannedUsers(
    userId TEXT PRIMARY KEY
    
    )
    `).run()

db.prepare(`
    CREATE TABLE IF NOT EXISTS Regected(
    userId TEXT PRIMARY KEY
    
    )
`).run()

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ChannelType,
    MessageFlags,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ActivityType,
    InteractionCallback,
    MessageSearchAuthorType,
    AuditLogEvent,
    PermissionFlagsBits,
    SelectMenuAssertions,
    ComponentsV2Assertions,
    TextDisplayBuilder,
    SeparatorBuilder,
    ContainerBuilder,
    StringSelectMenuBuilder,
    SeparatorComponent,
    time,
    Role,
    MessageFlagsBitField,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    TextInputAssertions,
    User,
    messageLink
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

require('dotenv').config();

const {REST, Routes, ApplicationCommandOptionType, applicationDirectory, ApplicationWebhookEventStatus, ApplicationCommandType, PermissionOverwriteManager} = require('discord.js');



const commands = [ 


  {
  name: "clearhistory",

  description: "Clear some one ban or regect history",

  options: [
      {
        name: "target",

        type:  ApplicationCommandOptionType.Mentionable,

        default_member_permissions: PermissionFlagsBits.Administrator.toString(),

        description: "the target user to clear history",

        required: true,
      }

  ],

  },
  {
    
    name: "ban",

    description: "Ban someone",

    default_member_permissions: PermissionFlagsBits.Administrator.toString(),

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
  { name: "ping",

  description: "mention the ping role",

  options: [{
    name: "message",

    description: "send a message with the ping",

    type: ApplicationCommandOptionType.String

  }]

  }
      




];
const rest = new REST({
    version: 10,
});



rest.setToken(process.env.TOKEN);



(async () => {
   try {

     console.log('Registring slash commands...');

    await rest.put(

       Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
       {body: commands }


    );

    console.log('slash commands has registred successfully!');
    
   } catch (error) {

     console.log(`there was a error the error was: ${error}`);
    
   } 


})();



client.on("clientReady", (c) => {
    console.log(`logged in as ${client.user.tag}`);

    client.user.setActivity({
        
        name: "GTA 6",

        type: ActivityType.Playing

})
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
              .setTitle("__🔔رتبة البينغ__")
              .addFields({name: "__❓ماذا تفعله هذه الرتبة__", value: "\nانها تعطينا الحق للقيام بعمل منشن لك"+"\nمتى ما اردنا ذلك"},
                         {name: "__❓ما ساحصل عليه انا__", value: "\nسوف تتمكن من رؤية اخبارنا الجديدة"+"\nوتصبح من الاوائل الذين سيعرفون عنها"},
                         {name: "__❓كيف يمكنني الحصول عليها__", value: "\nللحصول على رتبة" + " " + "<@&1521643199943282851>" + " " + "اضغط الزر ادناه"},
               ).setColor("Yellow")




            ],

            components: [row]
        });

         msg.delete()

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
                content:`🔕<@&1521643199943282851> لقد تم ازالة رتبة `,
                flags: MessageFlags.Ephemeral
            });

        }

    }

});

// ban slash command interaction

client.on("interactionCreate", async (int) => { 

if (int.commandName === "ban") {

    let member = int.options.getMember("usermention");

    if (!member) {
        return int.reply({
            content: "🤔couldn't find user",
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
}

    

});



// ping system

const Users = new Map();

client.on("interactionCreate", async (interaction) => {

if (interaction.commandName !== "ping") return;


    if (Users.has(interaction.user.id)) {

return interaction.reply({content: "انتضر"+ "```" + "10m" +"```" + "لتتمكن من عمل بينغ اخر",  flags: MessageFlags.Ephemeral })}


const embed4 = new EmbedBuilder()
.setAuthor({
    name: interaction.member.displayName,
    iconURL: interaction.user.displayAvatarURL()
})
.setFooter({text: "🔔pinged by" + " " + interaction.user.username})
.setTimestamp()
.setColor("Yellow")
.setTitle(interaction.options.getString("message") || null )

Users.set(interaction.user.id, true);

try {
   await interaction.channel.send({
    content: "<@&1521643199943282851>",
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

const URL = new Map()

client.on("messageCreate", async (msg) => {

    if (msg.content === "S&S") {

        const TextContainer = new TextDisplayBuilder()
            .setContent("# مرحبا بك!");

        const TextContainer2 = new TextDisplayBuilder()
            .setContent("## •يجب عليك تسجيل الدخول\n ## •لتظهر لك باقي قنوات السيرفر");

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
                    label: "سجل الدخول",
                    description: "قم بتسجيل الدخول",
                    value: "1",
                    emoji: "💾"
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
    }

});

// sign

const member = new Map();

client.on("interactionCreate", async (int) => {

    if (int.isStringSelectMenu()) {

        if (int.customId === "menu") {

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

                const NameRow = new ActionRowBuilder()
                    .addComponents(NameInput)

                const AgeRow = new ActionRowBuilder()
                    .addComponents(AgeInput)

                modal.addComponents(NameRow, AgeRow);

                await int.showModal(modal);

// search

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

                const idRow = new ActionRowBuilder()
                    .addComponents(idInput)

                modal.addComponents(idRow);

                await int.showModal(modal);


                }

// update

                    if (choice === "2") {

                const modal = new ModalBuilder()
                    .setCustomId("UpdateModal")
                    .setTitle("حدثث معلوماتك🔽");

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

                const NewNameRow = new ActionRowBuilder()
                    .addComponents(NewNameInput)

                const NewAgeRow = new ActionRowBuilder()
                    .addComponents(NewAgeInput)

                modal.addComponents(NewNameRow, NewAgeRow);

                await int.showModal(modal);

         }

      }

   }  

// sign system

    if (int.isModalSubmit()) {

        if (int.customId === "SignModal") {

            

         const name = int.fields.getTextInputValue("name")
  
         const age = int.fields.getTextInputValue("age")

            const check = db.prepare(`
            
            SELECT * FROM AgeUsers
            WHERE userId = ?
         

            `).get(int.user.id);

         const banned = db.prepare(`
            
            SELECT * FROM bannedUsers
            WHERE userId = ?
         

            `).get(int.user.id);

        const regect = db.prepare(`
            
            SELECT * FROM Regected
            WHERE userId = ?
         

            `).get(int.user.id);

            if (check) {return int.reply({content: "❌لقد سجلت بالفعل!", flags: MessageFlags.Ephemeral})}

            if (banned) {return int.reply({content: "❌لا يمكنك تسجيل الدخول بعد حذفك لمعلوماتك!", flags: MessageFlags.Ephemeral})}
            
            if (regect) {return int.reply({content: "❌لقد تم رفضك بالفعل!", flags: MessageFlags.Ephemeral})}
            

            URL.set("url", int.user.avatarURL())                  

         await int.reply({content: "✅لقد قمت بالتسجيل بنجاح", flags: MessageFlags.Ephemeral})

             const applyChannel = int.guild.channels.cache.get("1527053527145513130")

             

     const embed = new EmbedBuilder().setTitle(`__📃${int.user.username} قام بالتقديم__`)
     .setColor("White")
     .setTimestamp()
     .addFields({name: "الاسم", value: name},
                {name:  "العمر", value: age},
     ).setThumbnail(int.user.avatarURL())

     const approvedButton = new ButtonBuilder()
     .setCustomId(`a_${int.user.id}_${name}_${age}_${int.user.username}`)
     .setEmoji("✅")
     .setStyle(ButtonStyle.Success)

     const denyButton = new ButtonBuilder()
     .setCustomId(`d_${int.user.id}_${name}_${age}_${int.user.username}`)
     .setEmoji("❌")
     .setStyle(ButtonStyle.Danger)

     

     const row = new ActionRowBuilder().addComponents(approvedButton, denyButton)

     applyChannel.send({embeds: [embed], components: [row]})

    }

      }

     

// search system

                if (int.customId === "SearchModal") {

if (int.member.permissions.has(PermissionFlagsBits.Administrator)) {
                
             const idInput = int.fields.getTextInputValue("id") 

            const user =  db.prepare(`
                SELECT * FROM AgeUsers
                
                WHERE userId = ?

                `).get(idInput)

                if (user) {

                int.reply({embeds: [new EmbedBuilder().setColor("White")
                    .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM4a3fRsnjuGAy4UjGdc3gj7FRBSQw3mg15T33a7ZIpQ&s=10")
                    .setTitle("__🧾معلومات المستخدم__")
                    .addFields({name: "الاسم", value: `${user.username}`},
                        {name: "العمر", value: `${user.age}`}
                    )
                
                
                
                ], flags: MessageFlags.Ephemeral})} else {int.reply({content: "❌لم اعثر على المستخدم", flags: MessageFlags.Ephemeral})}
    
        } else {int.reply({content: "❌لا تمتلك الصلاحية لهذا", flags: MessageFlags.Ephemeral})}
    
    }

// update info system

          if (int.isModalSubmit()) {


           if (int.customId === "UpdateModal") {

        const newname = int.fields.getTextInputValue("NewName")

        const newage =  int.fields.getTextInputValue("NewAge")

             const user =  db.prepare(`
                SELECT * FROM AgeUsers
                
                WHERE userId = ?

                `).get(int.user.id)

                if (user  && int.member.roles.cache.has("1520422545721921627")) {

                db.prepare(`
                    
                    UPDATE AgeUsers

                    SET username = ?,  age = ?
                    WHERE userId = ?
            
                    
                    
                    
                    
                    `).run(
                      newname,
                      newage,
                      int.user.id
                    )

                  await int.reply({content:"✅تم تحديث معلوماتك بنجاح", flags: MessageFlags.Ephemeral})

                    
                    } else {int.reply({content:"❌لا تمتلك معلومات لتحديثها", flags: MessageFlags.Ephemeral})}





           }

        } 

});

client.on("interactionCreate", async (int) => {

// delete info system

     if (int.isButton()) {

     if (int.customId === "Delete") {



                const user =  db.prepare(`
                SELECT * FROM AgeUsers
                
                WHERE userId = ?

                `).get(int.user.id) 

                if (user && int.member.roles.cache.has("1520422545721921627")) {

db.prepare(`
    
    DELETE FROM AgeUsers
    
    WHERE userId = ?


    `).run(int.user.id)


     int.reply({content: "✅تم حذف معلوماتك بنجاح", flags: MessageFlags.Ephemeral})

     db.prepare(` 
        INSERT INTO bannedUsers (
          
        userId)

        VALUES (?)
        `).run(int.user.id)
        

     int.member.roles.remove("1520422545721921627")


     } else {int.reply({content: "❌لا تمتلك معلومات لحذفها", flags: MessageFlags.Ephemeral})}
    }

// self Search system

    if (int.customId === "MySelfSearch") {
            const user =  db.prepare(`
                
                SELECT * FROM AgeUsers
                
                WHERE userId = ? 
        
                AND username IS NOT NULL

                AND age IS NOT NULL



                `).get(int.user.id)

                if (user) {

                int.reply({embeds: [new EmbedBuilder().setColor("White")
                    .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM4a3fRsnjuGAy4UjGdc3gj7FRBSQw3mg15T33a7ZIpQ&s=10")
                    .setTitle("__🧾معلوماتك__")
                    .addFields({name: "الاسم", value: `${user.username}`},
                        {name: "العمر", value: `${user.age}`}
                    )
                
                
                
                ], flags: MessageFlags.Ephemeral})} else {int.reply({content: "❌لم اعثر على معلومات تتعلق بك", flags: MessageFlags.Ephemeral})}

    }

    // search all system
      
                if (int.customId === "AllSearch") {

                    if (int.member.permissions.has(PermissionFlagsBits.Administrator)) {

            const users = db.prepare(`
                
                SELECT * FROM AgeUsers

                WHERE username IS NOT NULL AND

                age IS NOT NULL
                `).all();

                

                let member = {};
                    
              let  felids = []

              let number = 0

                 users.forEach(user => {number += 1 ,felids.push({name: number+ "-" + " " + " " +`<@${user.userId}>`, 
                    value: `\nname: ${user.username} \nage: ${user.age}`},)

                })

                   if (users.length > 0) {

                      const embed = new EmbedBuilder()
                      .setTitle("__👥كل الاعضاء__")
                      .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM4a3fRsnjuGAy4UjGdc3gj7FRBSQw3mg15T33a7ZIpQ&s=10")
                      .setColor("White")
                     .addFields(felids)

                    
                        int.reply({embeds: [embed], flags: MessageFlags.Ephemeral})
                    

                } else {

                    const embeda = new EmbedBuilder()
                      .setColor("White")
                     .setDescription("👥لا اعضاء حتى الان")

                     int.reply({embeds: [embeda], flags: MessageFlags.Ephemeral})

                }

            } else {int.reply({content: "❌انت لا تمتلك الصلاحية", flags: MessageFlags.Ephemeral})}
        }
    
              if (int.customId.startsWith("a_")) {

                    

               const UserId = int.customId.split("_")[1]

               const UserName = int.customId.split("_")[2]

               const UserAge = int.customId.split("_")[3]

               const IdUserName = int.customId.split("_")[4]

               const Url = URL.get("url") 

               db.prepare(`
                INSERT INTO AgeUsers (username, age, userId)

                VALUES (?, ?, ?)
               `).run(
                   UserName,
                   UserAge,
                   UserId
               )

     const embed = new EmbedBuilder().setTitle(`__✅${IdUserName} تم قبول__`)
     .setColor("Green")
     .setTimestamp()
     .addFields({name: "الاسم", value: UserName},
                {name:  "العمر", value: UserAge},
                {name: "id", value: UserId},
     ).setThumbnail(Url)

     const approvedButton = new ButtonBuilder()
     .setCustomId("any")
     .setEmoji("✅")
     .setStyle(ButtonStyle.Success)
     .setDisabled(true)

     const denyButton = new ButtonBuilder()
     .setCustomId("ggg")
     .setEmoji("❌")
     .setStyle(ButtonStyle.Danger)
     .setDisabled(true)

     const row = new ActionRowBuilder().addComponents(approvedButton, denyButton)

               

                 int.message.edit({embeds: [embed],components: [row]})



const guildMember = await int.guild.members.fetch(UserId);

await guildMember.roles.add("1520422545721921627");


               int.reply({content: "✅لقد تم قبول العضو بنجاح!", flags: MessageFlags.Ephemeral})

    
                const embeda = new EmbedBuilder()
.setColor("Green")
.setAuthor({name: int.user.globalName})
.setTitle("✅ لقد تم قبولك")
.setThumbnail(int.guild.iconURL())
.setDescription("**[اذهب للسيرفر](https://discord.gg/8EvubxT5)**")
.setTimestamp();


        
    
              const member = int.guild.members.cache.get(UserId)

              if (member) {member.send({embeds: [embeda]})}


    }

                       if (int.customId.startsWith("d_")) {

               const UserId = int.customId.split("_")[1]

               const UserName = int.customId.split("_")[2]

               const UserAge = int.customId.split("_")[3]

               const IdUserName = int.customId.split("_")[4]

               const Url = URL.get("url")
               

             const embed = new EmbedBuilder().setTitle(`__❌${IdUserName} تم رفض__`)
     .setColor("Red")
     .setTimestamp()
     .addFields({name: "الاسم", value: UserName},
                {name:  "العمر", value: UserAge},
     ).setThumbnail(Url)

     const approvedButton = new ButtonBuilder()
     .setCustomId("any")
     .setEmoji("✅")
     .setStyle(ButtonStyle.Success)
     .setDisabled(true)

     const denyButton = new ButtonBuilder()
     .setCustomId("no")
     .setEmoji("❌")
     .setStyle(ButtonStyle.Danger)
     .setDisabled(true)

     const row = new ActionRowBuilder().addComponents(approvedButton, denyButton)

               

                 int.message.edit({embeds: [embed],components: [row]})

            
            int.reply({content: "❌تم رفض العضو بنجاح!", flags: MessageFlags.Ephemeral})

            db.prepare(`
                INSERT INTO Regected (userId)

        VALUES (?)
        `).run(UserId)


                          const embeda = new EmbedBuilder()
.setColor("Red")
.setAuthor({name: int.user.globalName})
.setTitle("❌ تم رفض التقديم")
.setThumbnail(int.guild.iconURL())
.setDescription("**[اذهب للسيرفر](https://discord.gg/8EvubxT5)**")
.setTimestamp();

   const member = int.guild.members.cache.get(UserId)

    if (member) {member.send({embeds: [embeda]})}

}}
});

client.on("interactionCreate", (interaction) => {

if (!interaction.isChatInputCommand) return;


if (interaction.commandName === "clearhistory") {

if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    
  const User = interaction.options.getMember("target") 

  if (User) {
 
const ban = db.prepare(`
    SELECT * FROM BannedUsers
    
    WHERE userId = ?
    
    
    `).get(User.user.id)

const regect = db.prepare(`
    SELECT * FROM Regected
    
    WHERE userId = ?
    
    
    `).get(User.user.id)

if (ban) {

 db.prepare(`
    DELETE FROM BannedUsers
    
    WHERE userId = ?
    
    `).run(User.user.id)  

    interaction.reply({content: "✅لقد تم فك الحظر بنجاح", flags: MessageFlags.Ephemeral})

 }

 if (regect) {

     db.prepare(`
    DELETE FROM Regected
    
    WHERE userId = ?
    
    `).run(User.user.id)  

    interaction.reply({content: "✅لقد تم فك الرفض بنجاح", flags: MessageFlags.Ephemeral})
 }

 if (!regect || ban) {interaction.reply({content: "❌المستخدم لا يمتلك اي حظر او رفض", flags: MessageFlags.Ephemeral})}

  } else {interaction.reply({content: "❌فشل العثور على المستخدم", flags: MessageFlags.Ephemeral})}

   



} else {interaction.reply({content: "❌لا تمتلك الصلاحية لذلك", flags: MessageFlags.Ephemeral})}

}


})

client.login(process.env.TOKEN)