import "dotenv/config";
import { AnyBlockElement, AnyHomeTabBlock, SlackApp } from "slack-edge";
//@ts-ignore it does infact; shut up deno
import * as  PrismaClient  from "@prisma/client";
import { genMainView } from "./views.ts";
import { ads } from "./ads.ts";
interface OmgMoment {
    id: string;
    description: string;
    video:string;
    created_at: string;
    kudos: number;
}
const slackApp = new SlackApp({
	env: {
		SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
		SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
		SLACK_LOGGING_LEVEL: "INFO",
	},
	startLazyListenerAfterAck: true,
});
// console.log(PrismaClient)
const db = new PrismaClient.default.PrismaClient()
db.$connect()
// hehehehehhehehehehrebgfebhjrbhjuehjfr 
export let ad_of_the_min = ads[Math.floor(Math.random() * ads.length)]
const client = slackApp.client
slackApp.event('app_home_opened', async ({ body, context }) => {
    // const { user } = body;
    // let is_logged_in = false
    const userEntry = await db.user.findFirst({
       where: {
           slackId: body.event.user
       }
      })
    //   console.log(userEntry, `DO I EXIST?`)

    await client.views.publish({
        user_id: body.event.user,
        view: {
            type: 'home',
            blocks: genMainView(body.event.user, userEntry),
        },
        // view_id: body.view.id,
    })
})
slackApp.action(`login_token`, async ({ body, context }) => {
    // console.log(body)

    const userId = body.user.id 
    const token = body.actions[0].value
    // console.log(token, userId)
    // send a view publish update with the new stuff
    // await client.users. 
    const userData =  await fetch("https://juice.hackclub.com/api/user", {
        headers: {
            "Authorization": `Zeon ${token}`
        }
    }).then(r=>r.json()).then(r=>r.userData)
    // console.log(0, userData)
    // if(!userData) return;
    // console.log(1, {
        // "slackID": body.user.id,
        // juicedata: 1
        // // create link to another table row
        // // "juice-userdatum": 1,
        // "juicedata":userData ?? {"e":1} 
    // })
    console.log(userData)
    await db.user.create({
        data: {
            slackId:  body.user.id,
            juice_token: userData.token,
            juice_joined_at: new Date(userData.created_at),
            juice_email: userData.email,
            // use prisma decimal
            juice_hours: new PrismaClient.default.Prisma.Decimal(userData.totalStretchHours),
            juice_kudos: parseInt(userData.totalKudos),
            juice_achievements: userData.achievements
        }
        // // juicedata: 1
        // // create link to another table row
        // // "juice-userdatum": 1,
   
        // ||  userData ?? {"e":1} 
    }).then(console.log)
    // update app home
    const userEntry = await db.user.findFirst({
        where: {
            slackId: body.user.id
        }
       })
    await client.views.publish({
        user_id: body.user.id,
        view: {
            type: 'home',
            blocks: genMainView(body.user.id, userEntry),
        },
        // view_id: body.view.id,
    })
})

slackApp.action(`submit_pr_link`, async ({ body, context }) => {
    // console.log(body)
    const pr_link = body.actions[0].value
    if(!pr_link) return;
    const userEntry = await db.user.findFirst({
        where: {
            slackId: body.user.id
        }
       })
    const userId = body.user.id
await db.user.update({
    where: {
        slackId: userId
    },
    data: {
        pr_link
    }
})
fetch("https://juice.hackclub.com/api/submit-pr", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        prLink: pr_link,
        token: userEntry!.juice_token
    })
})
    // // console.log(ID, pr_link)
    // await db.dbTableRow.update(
    //     "noco",          // Project name
    //     "pogq5o3wq26k67c",  // Table ID
    //     "mm73ua4qgwa3wxa",  // View ID (pass `null` if not using views)
    //     ID,      // Data to update
    //     { pr_link } // Correct `where` filter syntax
    // );
      await client.views.publish({
        user_id: body.user.id,

        view: {
            type: 'home',
            blocks: genMainView(body.user.id, await db.user.findFirst({
                where: {
                    slackId: userId
                }
               })),
        },
})
})

slackApp.action(`reload_juicedata`, async ({ body, context }) => {
    // console.log(body)
    const userId = body.user.id
    const userEntry = await db.user.findFirst({
        where: {
            slackId: userId
        }
       })
    //   console.log(userEntry)
    const userData = await fetch("https://juice.hackclub.com/api/user", {
        headers: {
            "Authorization": `Zeon ${userEntry.juicedata.token}`
        }
    }).then(r=>r.json()).then(r=>r.userData)
    await db.user.update({
        where: {
            slackId: userId
        },
        data: {
            juice_token: userData.token,
            juice_joined_at: userData.joined_at,
            juice_hours: userData.totalStretchHours,
            juice_kudos: userData.kudos,
            juice_achievements: userData.achievements
        }
    })
})
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    if (chunkSize <= 0) {
      throw new Error("Chunk size must be greater than 0.");
    }
  
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
  
    return result;
  }
slackApp.action(`kudos-menu`, async ({ body, context }) => {
    const value = body.actions[0].value 
    const startIndex = Number(value.split("-")[2]) * 20
    let data = await fetch("https://juice.hackclub.com/api/get-omg-moments").then(r=>r.json()).then(r=>r.sort((a: OmgMoment,b: OmgMoment) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as OmgMoment[])
   const isLastPage = startIndex + 20 > data.length
    const endIndex =  isLastPage ? data.length : startIndex + 20
    const isFirstPage = startIndex === 0
    data = data.slice(startIndex, endIndex)
    client.views.publish({
        user_id: body.user.id,
        view: {
            type: 'home',
            blocks: [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": ":kudos:",
                        "emoji": true
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": ":arrow_left:"
                            },
                            "action_id": "kudos-menu",
                            "value": "kudos-menu-0"
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Home page"
                            },
                            "action_id": "home",
                            "style": "primary"
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": ":arrow_right:"
                            },
                            "action_id": "kudos-menu-next",
                            "value": "kudos-menu-0"
                        }
                    ]
                },
                {
                    "type": "divider"
                },
                //@ts-ignore idk the error
               ...chunkArray(data, 10).map(dd=> {
return         [{
    type: "section",
    fields:         dd.map(d=> {
        return {
                        "type": "mrkdwn",
                        "text": `*${d.description}*\n> <${d.video}|Video>\n> ${d.kudos} :juice-kudos:\n> Created at: ${d.created_at}`
        }
                        })
}, {
    type: "divider"
}]
                }).flat()

            ]
            }
            })
})
setInterval(() => {
    ad_of_the_min = ads[Math.floor(Math.random() * ads.length)]
}, 1000 * 60)

Deno.serve({ port: Deno.env.get("PORT") || 0} ,async (req) => {
    console.log(`${req.method}: ${req.url}`)
 return   await slackApp.run(req);
})