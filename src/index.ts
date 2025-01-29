import "dotenv/config";
import { AnyBlockElement, AnyHomeTabBlock, SlackApp } from "slack-edge";
import { Api } from "nocodb-sdk";
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
// hehehehehhehehehehrebgfebhjrbhjuehjfr 
export let ad_of_the_min = ads[Math.floor(Math.random() * ads.length)]
const client = slackApp.client
const db = new Api({
    baseURL: "https://nocodb.saahild.com",
    headers: {
      "xc-token":process.env.DB_TOKEN
    }
})
slackApp.event('app_home_opened', async ({ body, context }) => {
    // const { user } = body;
    // let is_logged_in = false
    const userEntry = await db.dbViewRow.findOne("noco", "pogq5o3wq26k67c", "mm73ua4qgwa3wxa", "vwfx9pwsd41uanvh",   {
        fields: ["slackID", "pr_link", "hours_recorded_on_slack", "juicedata"],
        where: `(slackID,eq,${body.event.user})`,
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
    console.log(token, userId)
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
    await db.dbViewRow.create("noco",
        "pogq5o3wq26k67c",
        "mm73ua4qgwa3wxa",
        "vwfx9pwsd41uanvh", {
        "slackID":  body.user.id,
        // // juicedata: 1
        // // create link to another table row
        // // "juice-userdatum": 1,
        juicedata:userData
        // ||  userData ?? {"e":1} 
    }).then(console.log)
    // update app home
    const userEntry = await db.dbViewRow.findOne("noco", "pogq5o3wq26k67c", "mm73ua4qgwa3wxa", "vwfx9pwsd41uanvh",   {
        fields: ["slackID", "pr_link", "hours_recorded_on_slack", "juicedata"],
        where: `(slackID,eq,${body.user.id})`,
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
    const userId = body.user.id
    const ID = await db.dbViewRow.findOne("noco", "pogq5o3wq26k67c", "mm73ua4qgwa3wxa", "vwfx9pwsd41uanvh",   {
        fields: ["Id"],
        where: `(slackID,eq,${userId})`,
      }).then(r=>r.Id)
      
    console.log(ID, pr_link)
    await db.dbTableRow.update(
        "noco",          // Project name
        "pogq5o3wq26k67c",  // Table ID
        "mm73ua4qgwa3wxa",  // View ID (pass `null` if not using views)
        ID,      // Data to update
        { pr_link } // Correct `where` filter syntax
    );
      await client.views.publish({
        user_id: body.user.id,
        view: {
            type: 'home',
            blocks: genMainView(body.user.id, await db.dbViewRow.findOne("noco", "pogq5o3wq26k67c", "mm73ua4qgwa3wxa", "vwfx9pwsd41uanvh",   {
                fields: ["Id", "pr_link", "slackID", "hours_recorded_on_slack", "juicedata"],
                where: `(slackID,eq,${userId})`,
              })),
        },
})
})

slackApp.action(`reload_juicedata`, async ({ body, context }) => {
    // console.log(body)
    const userId = body.user.id
    const userEntry = await db.dbViewRow.findOne("noco", "pogq5o3wq26k67c", "mm73ua4qgwa3wxa", "vwfx9pwsd41uanvh",   {
        fields: ["Id", "juicedata"],
        where: `(slackID,eq,${userId})`,
      })
    //   console.log(userEntry)
    await db.dbViewRow.update("noco", "pogq5o3wq26k67c", "mm73ua4qgwa3wxa", "vwfx9pwsd41uanvh", userEntry.Id, {
        juicedata: await fetch("https://juice.hackclub.com/api/user", {
            headers: {
                "Authorization": `Zeon ${userEntry.juicedata.token}`
            }
        }).then(r=>r.json()).then(r=>r.userData)
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