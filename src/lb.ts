import { SlackApp } from "slack-edge";
import { PrismaClient } from "@prisma/client";

export async function cronJob(app: SlackApp<any>, db: PrismaClient) {
  const users = (await db.user.findMany({}))
    .filter((a) => a.juice_hours)
    .sort((a, b) => b.juice_hours!.toNumber() - a.juice_hours!.toNumber())
    .slice(0, 10);
  let str = `*Juice LB:*\n`;
  for (const user of users) {
    str += `- ${user.slack_handle ? `\`${user.slack_handle}\`` : `<@${user.slackId}>`} - \`${user.juice_hours}\` hours\n`;
  }
  app.client.chat.postMessage({
    channel: `C08BK1ZUU9W`,
    text: str,
  });
}
