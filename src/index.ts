import "dotenv/config";
import { AnyBlockElement, AnyHomeTabBlock, SlackApp } from "slack-edge";
//@ts-ignore it does infact; shut up deno
import * as PrismaClient from "@prisma/client";
import { genMainView } from "./views.ts";
import { ads } from "./ads.ts";
import { cronJob } from "./lb.ts";
import { exec } from "node:child_process";
interface OmgMoment {
  id: string;
  description: string;
  video: string;
  created_at: string;
  kudos: number;
}
export const UserStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  STOPPED: "STOPPED",
};
const slackApp = new SlackApp({
  env: {
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
    SLACK_LOGGING_LEVEL: "INFO",
  },
  startLazyListenerAfterAck: true,
});
let cache_for_fetch_every_min = new Set();
// console.log(PrismaClient)
const db = new PrismaClient.default.PrismaClient();
db.$connect();
// hehehehehhehehehehrebgfebhjrbhjuehjfr
export let ad_of_the_min = ads[Math.floor(Math.random() * ads.length)];
const client = slackApp.client;
slackApp.event("app_home_opened", async ({ body, context }) => {
  // const { user } = body;
  // let is_logged_in = false
  if (!cache_for_fetch_every_min.has(body.event.user)) {
    await reUpdateUsersData(db, body.event.user);
    cache_for_fetch_every_min.add(body.event.user);
    setTimeout(() => {
      cache_for_fetch_every_min.delete(body.event.user);
    }, 1000 * 60);
  }

  const userEntry = await db.user.findFirst({
    where: {
      slackId: body.event.user,
    },
  });
  //   console.log(userEntry, `DO I EXIST?`)

  await client.views.publish({
    user_id: body.event.user,
    view: {
      type: "home",
      blocks: genMainView(body.event.user, userEntry),
    },
    // view_id: body.view.id,
  });
});

slackApp.action(`login_token`, async ({ body, context }) => {
  // console.log(body)
  const userId = body.user.id;
  const token = body.actions[0].value;
  // console.log(token, userId)
  // send a view publish update with the new stuff
  // await client.users.
  const userData = await fetch(
    "https://sww48o88cs88sg8k84g4s4kg.a.selfhosted.hackclub.com/api/user",
    {
      headers: {
        Authorization: `Zeon ${token}`,
      },
    },
  )
    .then((r) => r.json())
    .then((r) => r.userData);
  // console.log(0, userData)
  // if(!userData) return;
  // console.log(1, {
  // "slackID": body.user.id,
  // juicedata: 1
  // // create link to another table row
  // // "juice-userdatum": 1,
  // "juicedata":userData ?? {"e":1}
  // })
  console.log(userData);
  await db.user
    .create({
      data: {
        slackId: body.user.id,
        juice_token: userData.token,
        juice_joined_at: new Date(userData.created_at),
        juice_email: userData.email,
        // use prisma decimal
        juice_hours: new PrismaClient.default.Prisma.Decimal(
          userData.totalJuiceHours,
        ),
        juice_kudos: parseInt(userData.totalKudos),
        juice_achievements: userData.achievements,
        //@ts-ignore idk the erro
        jungle_hours: new PrismaClient.default.Prisma.Decimal(
          userData.totalJungleHours,
        ),
        jungle_stretches: userData.jungleStretches,
        totalTokens: new PrismaClient.default.Prisma.Decimal(
          userData.totalTokens,
        ),
        slack_handle: userData["Slack Handle (from Slack)"]![0],
      },
      // // juicedata: 1
      // // create link to another table row
      // // "juice-userdatum": 1,
      // ||  userData ?? {"e":1}
    })
    .then(console.log);
  // update app home
  const userEntry = await db.user.findFirst({
    where: {
      slackId: body.user.id,
    },
  });
  await client.views.publish({
    user_id: body.user.id,
    view: {
      type: "home",
      blocks: genMainView(body.user.id, userEntry),
    },
    // view_id: body.view.id,
  });
});

slackApp.action(`submit_pr_link`, async ({ body, context }) => {
  // console.log(body)
  const pr_link = body.actions[0].value;
  if (!pr_link) return;
  const userEntry = await db.user.findFirst({
    where: {
      slackId: body.user.id,
    },
  });
  const userId = body.user.id;
  await db.user.update({
    where: {
      slackId: userId,
    },
    data: {
      pr_link,
    },
  });
  fetch("https://juice.hackclub.com/api/submit-pr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prLink: pr_link,
      token: userEntry!.juice_token,
    }),
  });
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
      type: "home",
      blocks: genMainView(
        body.user.id,
        await db.user.findFirst({
          where: {
            slackId: userId,
          },
        }),
      ),
    },
  });
});

// slackApp.action(`reload_juicedata`, async ({ body, context }) => {
//     // console.log(body)
//     const userId = body.user.id
//     const userEntry = await db.user.findFirst({
//         where: {
//             slackId: userId
//         }
//        })
//     //   console.log(userEntry)
//     const userData = await fetch("https://sww48o88cs88sg8k84g4s4kg.a.selfhosted.hackclub.com/api/user", {
//         headers: {
//             "Authorization": `Zeon ${userEntry.juicedata.token}`
//         }
//     }).then(r=>r.json()).then(r=>r.userData)
//     await db.user.update({
//         where: {
//             slackId: userId
//         },
//         data: {
//             juice_token: userData.token,
//             juice_joined_at: userData.joined_at,
//             juice_hours: userData.totalJuiceHours,
//             juice_kudos: userData.kudos,
//             juice_achievements: userData.achievements
//         }
//     })
// })
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
async function reUpdateUsersData(db: PrismaClient, id: string) {
  const currentData = await db.user.findFirst({
    where: {
      slackId: id,
    },
  });
  if (!currentData) return;
  const newData = await fetch(
    "https://sww48o88cs88sg8k84g4s4kg.a.selfhosted.hackclub.com/api/user",
    {
      headers: {
        Authorization: `Zeon ${currentData.juice_token}`,
      },
    },
  )
    .then((r) => r.json())
    .then((r) => r.userData);
  const userData = newData;
  await db.user.update({
    where: {
      slackId: id,
    },
    data: {
      juice_gamePr: newData.game_pr,
      pr_link: newData.game_pr,
      juice_token: newData.token,
      juice_joined_at: new Date(newData.created_at),
      juice_email: newData.email,
      // use prisma decimal
      juice_hours: new PrismaClient.default.Prisma.Decimal(
        newData.totalJuiceHours,
      ),
      juice_kudos: parseInt(newData.totalKudos),
      juice_achievements: newData.achievements,
      jungle_hours: new PrismaClient.default.Prisma.Decimal(
        userData.totalJungleHours,
      ),
      jungle_stretches: userData.jungleStretches,
      totalTokens: new PrismaClient.default.Prisma.Decimal(
        userData.totalTokens,
      ),
      slack_handle: userData["Slack Handle (from Slack)"]![0],
    },
  });
}
slackApp.action(`kudos-menu`, async ({ body, context }) => {
  const value = body.actions[0].value;
  const startIndex = Number(value.split("-")[2]) * 20;
  let data = await fetch("https://juice.hackclub.com/api/get-omg-moments")
    .then((r) => r.json())
    .then(
      (r) =>
        r.sort(
          (a: OmgMoment, b: OmgMoment) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ) as OmgMoment[],
    );
  const isLastPage = startIndex + 20 > data.length;
  const endIndex = isLastPage ? data.length : startIndex + 20;
  const isFirstPage = startIndex === 0;
  data = data.slice(startIndex, endIndex);
  client.views.publish({
    user_id: body.user.id,
    view: {
      type: "home",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: ":kudos:",
            emoji: true,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: ":arrow_left:",
              },
              action_id: "kudos-menu",
              value: "kudos-menu-0",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Home page",
              },
              action_id: "home",
              style: "primary",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: ":arrow_right:",
              },
              action_id: "kudos-menu-next",
              value: "kudos-menu-0",
            },
          ],
        },
        {
          type: "divider",
        },
        //@ts-ignore idk the error
        ...chunkArray(data, 10)
          .map((dd) => {
            return [
              {
                type: "section",
                fields: dd.map((d) => {
                  return {
                    type: "mrkdwn",
                    text: `*${d.description}*\n> <${d.video}|Video>\n> ${d.kudos} :juice-kudos:\n> Created at: ${d.created_at}`,
                  };
                }),
              },
              {
                type: "divider",
              },
            ];
          })
          .flat(),
      ],
    },
  });
});
slackApp.action(`juice-start`, async ({ body, context }) => {
  console.debug(`#juicemoment0`);
  const userId = body.user.id;
  const userEntry = await db.user.findFirst({
    where: {
      slackId: userId,
    },
  });
  if (!userEntry) return;
  if (userEntry.session_started) return;
  // send an api req saying im running that session fr
  const stretchId = await fetch(
    "https://juice.hackclub.com/api/start-juice-stretch",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Zeon ${userEntry.juice_token}`
      },
      body: JSON.stringify({
        token: userEntry.juice_token,
      }),
    },
  )
    .then((r) => r.json())
    .then((r) => r.stretchId);
  await db.user.update({
    where: {
      slackId: userId,
    },
    data: {
      session_started: stretchId,
      //@ts-ignore types broken
      session_status: UserStatus.ACTIVE,
    },
  });
});

slackApp.action(`juice-pause`, async ({ body, context }) => {
  console.debug(`#juicemoment1`);
  const userId = body.user.id;
  const userEntry = await db.user.findFirst({
    where: {
      slackId: userId,
    },
  });
  if (!userEntry) return;
  if (!userEntry.session_started) return;
  // pause the stretch
  await fetch("https://juice.hackclub.com/api/pause-juice-stretch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // "Authorization": `Zeon ${userEntry.juice_token}`
    },
    body: JSON.stringify({
      token: userEntry.juice_token,
      stretchId: userEntry.session_started,
    }),
  });
  await db.user.update({
    where: {
      slackId: userId,
    },
    data: {
      // change to paused
      //@ts-ignore uh idk not picking up types
      session_status: UserStatus.PAUSED,
    },
  });
  // TODO: at end of each action (juice-*) re render
  await client.views.publish({
    user_id: body.user.id,
    view: {
      type: "home",
      blocks: genMainView(
        body.user.id,
        await db.user.findFirst({
          where: {
            slackId: userId,
          },
        }),
      ),
    },
    // view_id: body.view.id,
  });
});
slackApp.action(`juice-stop-record`, async ({ body, context }) => {
  console.debug(`#juicemoment2-1`);
  const userId = body.user.id;
  const userEntry = await db.user.findFirst({
    where: {
      slackId: userId,
    },
  });
  if (!userEntry) return;
  if (!userEntry.session_started) return;
  // stop the stretch
  // await fetch("https://juice.hackclub.com/api/stop-juice-stretch", {
  //     method: "POST",
  //     headers: {
  //         "Content-Type": "application/json",
  //         // "Authorization": `Zeon ${userEntry.juice_token}`
  //     },
  //     body: JSON.stringify({
  //         token: userEntry.juice_token,
  //         stretchId: userEntry.session_started
  //     })
  // })
  // pop up a modal asking for a description and video file upload
  await client.views.open({
    user_id: body.user.id!,
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "video_submission",
      title: { type: "plain_text", text: "Submit a Video" },
      submit: { type: "plain_text", text: "Submit" },
      close: { type: "plain_text", text: "Cancel" },
      blocks: [
        {
          type: "input",
          block_id: "video_url_block",
          label: { type: "plain_text", text: "Video URL" },
          element: {
            type: "plain_text_input",
            action_id: "video_url",
            placeholder: { type: "plain_text", text: "Enter the video URL" },
          },
        },
        {
          type: "input",
          block_id: "video_description_block",
          label: { type: "plain_text", text: "Description" },
          optional: true, // This makes it optional
          element: {
            type: "plain_text_input",
            action_id: "video_description",
            multiline: true,
            placeholder: {
              type: "plain_text",
              text: "Provide a brief description (optional)",
            },
          },
        },
      ],
    },
  });
});

slackApp.view("video_submission", async ({ body, context }) => {
  // todo: upload video to stupid cdn and then create the moment ig??HNUJBSFRNUIRUFHN1
  //  await ack();
  // console.log(body)
  const view = body.view;
  const user = body.user.id;
  const videoUrl = view.state.values.video_url_block.video_url.value;
  const videoDescription =
    view.state.values.video_description_block.video_description.value ||
    "No description provided";
  // console.log(videoUrl, videoDescription, user)
  const userEntry = await db.user.findFirst({
    where: {
      slackId: user,
    },
  });
  if (!userEntry) return;
  if (!userEntry.session_started) return;
  // upload video to the express backend cdn thing which for some reason needs all the creds.. why? idk why please help
  const form = new FormData();
  form.append("video", await fetch(videoUrl).then((r) => r.blob()));
  form.append("description", videoDescription);
  form.append("stretchId", userEntry.session_started);
  form.append("token", userEntry.juice_token);
  form.append("stopTime", new Date().toISOString());
  await fetch(
    "https://sww48o88cs88sg8k84g4s4kg.a.selfhosted.hackclub.com/api/video/upload",
    {
      method: "POST",
      body: form,
    },
  )
    .then((r) => r.json())
    .then(console.log);
  // now lets send ts to the other api
  await fetch("https://juice.hackclub.com/api/create-omg-moment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // "Authorization": `Zeon ${userEntry.juice_token}`
    },
    body: JSON.stringify({
      token: userEntry.juice_token,
      stretchId: userEntry.session_started,
    }),
  });
  await db.user.update({
    where: {
      slackId: user,
    },
    data: {
      // change to stopped
      //@ts-ignore uh idk not picking up types
      session_status: UserStatus.STOPPED,
      //@ts-ignore WHEN WILL THE TYPES UPDATE
      session_started: null,
    },
  });
  client.views.publish({
    user_id: body.user.id,
    view: {
      type: "home",
      blocks: genMainView(
        body.user.id,
        await db.user.findFirst({
          where: {
            slackId: user,
          },
        }),
      ),
    },
  });
});

slackApp.action(`juice-stop`, async ({ body, context }) => {
  console.debug(`#juicemoment2`);
  const userEntry = await db.user.findFirst({
    where: {
      slackId: body.user.id,
    },
  });
  if (!userEntry) return;
  if (!userEntry.session_started) return;
  // stop the stretch
  await fetch("https://juice.hackclub.com/api/stop-juice-stretch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // "Authorization": `Zeon ${userEntry.juice_token}`
    },
    body: JSON.stringify({
      token: userEntry.juice_token,
      stretchId: userEntry.session_started,
    }),
  });
  await db.user.update({
    where: {
      slackId: body.user.id,
    },
    data: {
      // change to stopped
      //@ts-ignore uh idk not picking up types
      session_status: UserStatus.STOPPED,
      //@ts-ignore WHEN WILL THE TYPES UPDATE
      session_started: null,
    },
  });

  await client.views.publish({
    user_id: body.user.id,
    view: {
      type: "home",
      blocks: genMainView(
        body.user.id,
        await db.user.findFirst({
          where: {
            slackId: body.user.id,
          },
        }),
      ),
    },
  });
});
setInterval(() => {
  ad_of_the_min = ads[Math.floor(Math.random() * ads.length)];
}, 1000 * 60);
setInterval(
  () => {
    cronJob(slackApp, db);
  },
  1000 * 60 * 5,
);

setInterval(() => {
  exec(`git pull -v`, (error, stdout) => {
    const response = error || stdout;
    if (!error) {
      if (!response.includes("Already up to date.")) {
        console.log(response);
        setTimeout(() => {
          process.exit();
        }, 1000);
      }
    }
  });
}, 30000);
Deno.serve({ port: Deno.env.get("PORT") || 0 }, async (req) => {
  console.log(`${req.method}: ${req.url}`);
  return await slackApp.run(req);
});
