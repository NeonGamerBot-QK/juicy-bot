import { AnyHomeTabBlock } from "slack-edge";
import { ad_of_the_min, UserStatus } from "./index.ts";

export const login_blocks = [
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Please give me ur token so i can login*",
    },
  },
  {
    dispatch_action: true,
    type: "input",
    element: {
      type: "plain_text_input",
      action_id: "login_token",
    },
    label: {
      type: "plain_text",
      text: "Token",
      emoji: true,
    },
  },
  {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "You can get the token via the file you downloaded or from `localStorage.token`",
      },
    ],
  },
];
export const juice_in_emojis = `:blank::blank::blank::blank::blank::blank::blank::040301::030200::blank::blank::blank::blank::blank::blank::blank::blank::blank::blank::blank:
:blank::blank::blank::blank::blank::blank::040301::070401::100704::090704::030201::blank::blank::blank::blank::blank::blank::blank::blank::blank:
:blank::blank::blank::blank::blank::blank::blank::blank::blank::080603::060402::blank::blank::blank::blank::blank::blank::blank::blank::blank:
:blank::blank::blank::blank::blank::blank::blank::blank::blank::060402::080704::030604::blank::blank::blank::blank::blank::blank::blank::blank:
:blank::blank::blank::blank::blank::blank::010102::020303::050805::060804::060805::060704::060403::030201::blank::blank::blank::blank::blank::blank:
:blank::blank::blank::010201::040704::050905::030504::020304::030504::040805::040604::060402::050403::040604::030604::blank::blank::blank::blank::blank:
:blank::blank::blank::020402::030603::040805::040805::030604::040805::050906::050906::040705::050905::040905::030804::020302::020201::blank::blank::blank:
:blank::blank::blank::020402::020503::020603::030604::050906::050906::050905::040805::030806::020706::030804::030804::blank::050301::020201::blank::blank:
:blank::blank::blank::020402::020603::020503::020503::030704::030804::030705::020608::050708::050709::020608::030805::020101::100301::040100::blank::blank:
:blank::blank::blank::020302::030503::020503::020603::030704::030705::040709::070605::090602::070706::060506::040505::020101::100301::050200::blank::blank:
:blank::blank::blank::060202::100808::060403::030603::030704::020707::050708::060707::060404::070505::100707::090202::010000::080301::030100::blank::blank:
:blank::blank::020303::050404::080304::100707::090505::040604::040605::080404::090606::090505::080202::060505::040503::010101::blank::blank::blank::blank:
:blank::blank::050607::070910::050404::060505::060303::040604::030704::070404::070202::060405::060405::060406::040704::blank::blank::blank::blank::blank:
:blank::blank::050607::070910::040405::040506::060708::030704::030704::050405::070507::090909::080808::060406::030604::blank::blank::blank::blank::blank:
:blank::blank::030405::070910::040405::040506::060708::030704::030704::060406::080708::090909::080808::060506::030604::blank::blank::blank::blank::blank:
:blank::blank::blank::040403::060403::050505::050708::030603::030603::050405::060505::070605::050403::040403::030603::blank::blank::blank::blank::blank:
:blank::blank::blank::040507::030404::050402::050302::030603::030603::030302::050403::030503::030503::030603::030704::blank::blank::blank::blank::blank:
:blank::blank::010203::050406::040505::030503::020402::030603::030603::030603::030603::030603::030603::030604::010302::blank::blank::blank::blank::blank:
:blank::blank::030201::030200::020100::020201::020503::030603::030603::030603::030603::020503::010201::blank::blank::blank::blank::blank::blank::blank:
:blank::blank::blank::blank::blank::blank::blank::020302::020402::010302::blank::blank::blank::blank::blank::blank::blank::blank::blank::blank:`;
export const juice_img = {
  type: "section",
  text: {
    text: juice_in_emojis.slice(0, 3000)!,
    type: "mrkdwn",
    // emoji: true
  },
};
export const kudos_button = {
  type: "actions",
  elements: [
    {
      type: "button",
      text: {
        type: "plain_text",
        text: ":juice-kudos:",
        emoji: true,
      },
      value: "kudos-menu-0",
      action_id: "kudos-menu",
    },
  ],
};
export function genMainView(slackID: string, userEntry: any) {
  console.debug(`#0`, userEntry, slackID);
  //@ts-ignore ts error
  const is_logged_in = Boolean(userEntry?.slackId);
  // console.log(body)
  const blocks: AnyHomeTabBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":juice:",
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    //@ts-ignore shush
    ...(is_logged_in
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Hi <@${userEntry.slackId}>, you currently have ${userEntry.hours_recorded_on_slack} hours on slack (and ${userEntry.juice_hours} hours in total)`,
            },
            //@ts-ignore shut up i cant focus
          },
          !userEntry.pr_link
            ? {
                dispatch_action: true,
                type: "input",
                element: {
                  type: "plain_text_input",
                  action_id: "submit_pr_link",
                },
                label: {
                  type: "plain_text",
                  text: "PR Link",
                  emoji: true,
                },
              }
            : null,
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Juicer",
              emoji: true,
            },
          },
          {
            type: "divider",
          },
          userEntry.session_status === UserStatus.ACTIVE
            ? {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `You are currently running a :juice: session!`,
                },
              }
            : userEntry.session_status === UserStatus.PAUSED
              ? {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `You are currently paused a :juice: session!`,
                  },
                }
              : null,
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: ":arrow_forward:",
                  emoji: true,
                },
                value: "start-juice-moment",
                action_id: "juice-start",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: ":double_vertical_bar:",
                  emoji: true,
                },
                value: "pause-juice-moment",
                action_id: "juice-pause",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: ":x:",
                  emoji: true,
                },
                value: "stop-juice-moment",
                action_id: "juice-stop",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "End time and upload video :3",
                  emoji: true,
                },
                value: "stop-juice-moment",
                action_id: "juice-stop-record",
              },
            ],
          },
        ].filter(Boolean)
      : login_blocks),
    //@ts-ignore shut up i cant focus

    {
      type: "divider",
    },
    //@ts-ignore shut up i cant focus

    kudos_button,
    //@ts-ignore shut up i cant focus

    {
      type: "divider",
    },
    //@ts-ignore shut up i cant focus
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*AD:* ${ad_of_the_min}`,
      },
    },
  ];
  return blocks;
}
