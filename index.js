require("dotenv").config();
const {
  updateCard,
  getAllCard,
  retriveDeck,
  getDeckCard
} = require("./notion");
const {
  setNewInterval
} = require("./card");
const {
  carouselImg
} = require("./flex-image")
const line = require("@line/bot-sdk");
const app = require('express')();
const port = process.env.PORT || 3000;
const today = new Date(Date.now())

//setting line
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

const sendBack = (displayText, _card, deck) => {
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
            data: `{"pageId": "${pageId}", "input": "again", "deck":"${deck}"}`,
            displayText: "again",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `hard😐 (${hardPredicted} วัน)`,
            data: `{"pageId": "${pageId}", "input": "hard", "deck":"${deck}"}`,
            displayText: "hard",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `good🙂 (${goodPredicted} วัน)`,
            data: `{"pageId": "${pageId}", "input": "good", "deck":"${deck}"}`,
            displayText: "good",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `easy🤣 (${easyPredicted} วัน)`,
            data: `{"pageId": "${pageId}", "input": "easy", "deck":"${deck}"}`,
            displayText: "easy",
          },
        },
      ],
    },
  };
};

const sendCard = (displayText, pageId, deck) => {
  return {
    type: "text",
    text: displayText,
    quickReply: {
      items: [{
        type: "action",
        action: {
          type: "postback",
          label: "เฉลย",
          data: `{"pageId": "${pageId}", "input": "back", "deck": "${deck}"}`,
          displayText: "เฉลย",
        },
      }, ],
    },
  };
};

const sendDecks = (displayText, decks) => {
  const quickReply = {
    type: "text",
    text: displayText,
    quickReply: {
      items: [{
        type: "action",
        action: {
          type: "postback",
          label: "สุ่มการ์ด",
          data: `{"selectDeck": "random"}`,
          displayText: "สุ่มการ์ด",
        }
      }],
    },
  };

  for (let i in decks) {
    quickReply.quickReply.items.push({
      type: "action",
      action: {
        type: "postback",
        label: decks[i],
        data: `{"selectDeck": "${decks[i]}"}`,
        displayText: decks[i],
      },
    })
  }

  return quickReply;
}

const sendContinue = (remain, deck) => {
  return {
    type: "text",
    text: `เหลือการ์ดวันนี้อีก ${remain} ใบ`,
    quickReply: {
      items: [{
          type: "action",
          action: {
            type: "postback",
            label: "เปิด",
            data: `{"input": "next", "deck": "${deck}"}`,
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

const pushcard = async (deck = "random", eventId = null) => {

  let cardArr;
  if (deck == "random") {
    cardArr = await getAllCard();
  } else {
    cardArr = await getDeckCard(deck);
  }

  const todayCard = cardArr.filter(card => new Date(card.date).getTime() < today.getTime())

  if (todayCard.length !== 0) {
    let card;
    if (deck == "random") {
      card = todayCard[Math.floor(Math.random() * todayCard.length)]
    } else {
      card = todayCard[0];
    }

    //get front side of card
    const front = card.front;
    const pageId = card.page_id;
    const message = sendCard(front, pageId, deck)

    //push notify
    if (eventId !== null) {
      const response = await client.replyMessage(
        eventId,
        message
      )
    } else {
      const response = await client.broadcast(message);
      return response;
    }
  } else {
    console.log("No today card")
    if (eventId !== null) {
      let text;
      if (deck == "random") {
        text = message("ไม่มีการ์ดวันนี้แล้ว🎉")
      } else {
        text = message("สำรับนี้ไม่มีการ์ดวันนี้แล้ว🎉")
      }
      const response = await client.replyMessage(
        eventId,
        text
      )
    }
    return "No today card";
  }
}

app.get('/pushcard', async (req, res) => {
  const response = await pushcard();
  res.send(response);
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

  //user send message "open card"
  if (event.type == "message") {
    switch (event.message.text) {
      case "open card":
        //get all decks
        const decks = await retriveDeck("deck");

        //user select decks
        const message = sendDecks("เลือกหมวด", decks);
        const response = await client.replyMessage(
          event.replyToken,
          message
        );
        break;
      default: break;
    }
  }

  //check for postback
  if (event.type == 'postback') {
    const data = JSON.parse(event.postback.data);
    const pageId = data.pageId;
    const input = data.input
    const deck = data.deck || null;

    //push card when select deck
    if (data.selectDeck) {
      const deck = data.selectDeck;
      const response = await pushcard(deck, event.replyToken);
      return response;
    }

    if (input == "next") {
      //send new question
      const response = await pushcard(deck, event.replyToken)
      console.log("send new question")
      return response;
    }

    if (input == "later") {
      return event;
    }

    //get notion card
    let getCard;
    if (deck == "random") {
      getCard = await getAllCard();
    } else {
      getCard = await getDeckCard(deck);
    }
    const filterCard = getCard.filter(card => card.page_id == pageId)
    const card = filterCard[0] || {};
    const back = card.back || "";
    const image = card.image || null;

    if (input == "back") {
      //send answer
      let message;
      if(image !== null){
        const carousel = carouselImg(image);
        message = [carousel, sendBack(back, card, deck)]
      }else{
        message = sendBack(back, card, deck);
      }
      const response = await client.replyMessage(
        event.replyToken,
        message
      );
      console.log("Send back card")
    } else {
      //if user press good hard easy or again
      ///////////////////////////////////////

      //set new interval
      const modifiedCard = setNewInterval(card, input);

      //update card status to notion
      await updateCard(modifiedCard)
      console.log("Update Success");

      //send remain card
      let cardArr;
      if (deck == "random") {
        cardArr = await getAllCard();
      } else {
        cardArr = await getDeckCard(deck);
      }
      const todayCard = cardArr.filter(card => new Date(card.date).getTime() < today.getTime())
      const remain = todayCard.length;
      if (remain !== 0) {
        const response = await client.replyMessage(
          event.replyToken,
          sendContinue(remain, deck)
        );
        console.log("Send remain card")
      } else {
        const response = await client.replyMessage(
          event.replyToken,
          message("ทวนการ์ดวันนี้ครบแล้ว🎉")
        );
      }
    }
  }
  return event;
}

const pushImg = async() => {
  const response = await client.broadcast(carousel);
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})