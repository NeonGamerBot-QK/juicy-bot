import { SlackApp } from "slack-edge";
import { PrismaClient } from "@prisma/client";

export async function cronJob(app: SlackApp<any>, db: PrismaClient) {
    // 
const users = (await db.user.findMany({})).filter(a => a.juice_hours).sort((a,b) => a.juice_hours!.toNumber() - b.juice_hours!.toNumber())
let str  =    `*Juice LB:*\n`
for(const user of users) {
    str += `- <@${user.slackId}> - \`${user.juice_hours}\` hours\n`
}
app.client.chat.postMessage({
        channel: `C08BK1ZUU9W`,
        text: str 
    })
}

// every 30 mins, 5s delay per each user, if usercount is above 30 (no way this happens) make the delay 10s
export function updateUsersData(app: SlackApp<any>, db: PrismaClient) {}