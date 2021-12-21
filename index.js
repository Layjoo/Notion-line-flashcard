require("dotenv").config();
const {
  getTodayCard,
  updateCard,
  getAllCard
} = require("./notion");
const {
  setNewInterval
} = require("./card");
const line = require("@line/bot-sdk");
const {
  default: axios
} = require("axios");
const command = require("nodemon/lib/config/command");
const database = process.env.DATABASE;
const app = require('express')();
const port = process.env.PORT || 3000;
const today = new Date(Date.now())

//setting line
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

const sendBack = (displayText, _card) => {
  const pageId = _card.page_id;
  const easyPredicted = setNewInterval(_card, "easy").current;
  const hardPredicted = setNewInterval(_card, "hard").current;
  const goodPredicted = setNewInterval(_card, "good").current;

  const card = JSON.stringify(_card);
  return {
    type: "text",
    text: displayText,
    quickReply: {
      items: [{
          type: "action",
          action: {
            type: "postback",
            label: `again💀`,
            data: `{"pageId": "${pageId}", "input": "again"}`,
            displayText: "again",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `hard😐 (${hardPredicted} วัน)`,
            data: `{"pageId": "${pageId}", "input": "hard"}`,
            displayText: "hard",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `good🙂 (${goodPredicted} วัน)`,
            data: `{"pageId": "${pageId}", "input": "good"}`,
            displayText: "good",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `easy🤣 (${easyPredicted} วัน)`,
            data: `{"pageId": "${pageId}", "input": "easy"}`,
            displayText: "easy",
          },
        },
      ],
    },
  };
};

const sendCard = (displayText, pageId) => {
  return {
    type: "text",
    text: displayText,
    quickReply: {
      items: [{
        type: "action",
        action: {
          type: "postback",
          label: "เฉลย",
          data: `{"pageId": "${pageId}", "input": "back"}`,
          displayText: "เฉลย",
        },
      }, ],
    },
  };
};

const sendContinue = (remain) => {
  return {
    type: "text",
    text: `เหลือการ์ดวันนี้อีก ${remain} ใบ`,
    quickReply: {
      items: [{
          type: "action",
          action: {
            type: "postback",
            label: "เปิด",
            data: `{"input": "next"}`,
            displayText: "เปิด",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "ไว้ที่หลัง",
            data: `{"input": "later"}`,
            displayText: "ไว้ที่หลัง",
          },
        },
      ],
    },
  };
}

const message = (message) => {
  return {
    type: "text",
    text: message,
  };
};

app.get('/pushcard', async (req, res) => {
  //get card from notion for today
  const cardArr = await getAllCard(database);
  const todayCard = cardArr.filter(card=>new Date(card.date).getTime() < today.getTime())
  if (todayCard.length !== 0) {
    const card = todayCard[0];

    //get card front
    const front = card.front;
    const pageId = card.page_id;
    console.log(pageId)
    const message = sendCard(front, pageId);

    //push notify
    const response = await client.broadcast(message);
    res.send(response);
  } else {
    console.log("No today card")
    res.send({
      reply: "No today card"
    });
  }
})

//web hook, get event when user do somthing with bot
app.post("/callback", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler if user interaction with bot
async function handleEvent(event) {

  if(event.type == "message" && event.message.text == "open card"){
    //send new question
    const response = await axios({
      method: "get",
      url: "https://line-flash-card.herokuapp.com/pushcard"
    })
    console.log("send new question")
  }

  //check for postback
  if (event.type == 'postback') {
    const data = JSON.parse(event.postback.data);
    const pageId = data.pageId;

    //get notion card
    const getCard = await getAllCard(database);
    const filterCard = getCard.filter(card => card.page_id == pageId)
    const card = filterCard[0] || {};
    const back = card.back || "";
    const input = data.input

    if(input == "later"){
      return event;
    }

    if (input == "back") {
      //send back card
      const message = sendBack(back, card);
      const response = await client.replyMessage(
        event.replyToken,
        message
      );
      console.log("Send back card")

    } else if (input == "next") {
      //send new question
      const response = await axios({
        method: "get",
        url: "https://line-flash-card.herokuapp.com/pushcard"
      })
      console.log("send new question")

    } else {
      //set new interval
      const modifiedCard = setNewInterval(card, input);

      //upload status to notion
      await updateCard(modifiedCard)
      console.log("Update Success");

      //send remain card?
      const cardArr = await getAllCard(database);
      const todayCard = cardArr.filter(card=>new Date(card.date).getTime() < today.getTime())
      const remain = todayCard.length;
      
      if(remain !== 0){
      const response = await client.replyMessage(
        event.replyToken,
        sendContinue(remain)
      );
      console.log("Send remain card")
      }else{
        const response = await client.replyMessage(
        event.replyToken,
        message("ทวนการ์ดวันนี้ครบแล้ว🎉")
      );
      }
    }
  }
  return event;
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})