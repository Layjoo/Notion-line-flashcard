require("dotenv").config();
const {
  updateCard,
  getAllCard,
  retriveDeck,
  getDeckCard,
  updateSuspend,
  retriveTag,
  getTagCard,
  getCardfromPageId
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
const dateNow = new Date(Date.now())
const date = dateNow.getDate();
let today = dateNow.toISOString().slice(0, 8);
today = today.concat(date)
today = new Date(today);

//setting line
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

const sendBack = (displayText, card, deck, tag) => {
  const pageId = card.page_id;
  //calculate interval prediction
  const easyPredicted = setNewInterval(card, "easy").current;
  const hardPredicted = setNewInterval(card, "hard").current;
  const goodPredicted = setNewInterval(card, "good").current;

  return {
    type: "text",
    text: displayText,
    quickReply: {
      items: [{
          type: "action",
          action: {
            type: "postback",
            label: `again💀`,
            data: JSON.stringify({"pageId": pageId, "input": "again", "deck": deck, "tag": tag}),
            displayText: "again",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `hard😐 (${hardPredicted} วัน)`,
            data: JSON.stringify({"pageId": pageId, "input": "hard", "deck": deck, "tag": tag}),
            displayText: "hard",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `good🙂 (${goodPredicted} วัน)`,
            data: JSON.stringify({"pageId": pageId, "input": "good", "deck": deck, "tag": tag}),
            displayText: "good",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `easy🤣 (${easyPredicted} วัน)`,
            data: JSON.stringify({"pageId": pageId, "input": "easy", "deck": deck, "tag": tag}),
            displayText: "easy",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: `suspend🔥`,
            data: JSON.stringify({"pageId": pageId, "input": "suspend", "deck": deck, "tag": tag}),
            displayText: "ระงับการ์ด",
          },
        }
      ],
    },
  };
};

const sendCard = (displayText, pageId, deck, tag) => {
  return {
    type: "text",
    text: displayText,
    quickReply: {
      items: [{
        type: "action",
        action: {
          type: "postback",
          label: "เฉลย",
          data: `{"pageId": "${pageId}", "input": "back", "deck": "${deck}", "tag": "${tag}"}`,
          displayText: "เฉลย",
        },
      }, ],
    },
  };
};

const sendDecks = async(displayText, decks) => {
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

const sendTag = (displayText, deck, tags) => {
  const quickReply = {
    type: "text",
    text: displayText,
    quickReply: {
      items: [{
        type: "action",
        action: {
          type: "postback",
          label: "สุ่มการ์ด",
          data: `{"selectTag": "random", "deck": "${deck}"}`,
          displayText: "สุ่มการ์ด",
        }
      }],
    },
  };

  for (let i in tags) {
    quickReply.quickReply.items.push({
      type: "action",
      action: {
        type: "postback",
        label: tags[i],
        data: `{"selectTag": "${tags[i]}", "deck": "${deck}"}`,
        displayText: tags[i],
      },
    })
  }

  return quickReply;
}

const sendContinue = (remain, deck, tag) => {
  return {
    type: "text",
    text: `เหลือการ์ดวันนี้อีก ${remain} ใบ`,
    quickReply: {
      items: [{
          type: "action",
          action: {
            type: "postback",
            label: "เปิด",
            data: `{"input": "next", "deck": "${deck}", "tag": "${tag}"}`,
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

const sendRemainCard = async(event, deck, tag) => {
  //get card base on user select deck or tag
  let cardArr;
  if(tag=="false"){
    if (deck == "random") {
      cardArr = await getAllCard();
    } else {
      cardArr = await getDeckCard(deck);
    }
  }else{
    if (tag == "random") {
      cardArr = await getDeckCard(deck);
    } else {
      cardArr = await getTagCard(tag, deck);
    }
  }
  console.log(`all card = ${cardArr.length}`)

  //check card for today or overdue
  const todayCard = cardArr.filter(card => new Date(card.date).getTime() <= today.getTime())
  const remain = todayCard.length;
  console.log(`remain card = ${remain}`)

  //send remain
  if (remain !== 0) {
    const response = await client.replyMessage(
      event.replyToken,
      sendContinue(remain, deck, tag)
    );
    console.log("send remain card")
  } else {
    const response = await client.replyMessage(
      event.replyToken,
      message("ทวนการ์ดครบแล้ว🎉")
    );
  }
}

const message = (message) => {
  return {
    type: "text",
    text: message,
  };
};

const pushcard = async (deck = "random", eventId = null, tag = "false") => {
  
  //get card base on user select deck or tag
  let cardArr;
  if(tag == "false"){
    if (deck == "random") {
      cardArr = await getAllCard();
    } else {
      cardArr = await getDeckCard(deck);
    }
  }else{
    if (tag == "random") {
      cardArr = await getDeckCard(deck);
    } else {
      cardArr = await getTagCard(tag, deck);
    }
  }

  //check card for today or overdue
  const todayCard = cardArr.filter(card => new Date(card.date).getTime() <= today.getTime())
  console.log(`today card = ${todayCard.length}`)

  if (todayCard.length !== 0) {
    let card;
    //pick 1 card to show
    if (deck == "random" || tag == "random") {
      card = todayCard[Math.floor(Math.random() * todayCard.length)]
    } else {
      card = todayCard[0];
    }

    //get front side of card
    const front = card.front || null;
    const pageId = card.page_id;
    const frontImg = card.front_image || null;
    const option = card.option || null;

    //check quiz card
    let frontMessage;
    if(option == "quiz"){
      frontMessage = sendChoice(front, pageId, deck, tag)
    }else{
      frontMessage = sendCard(front, pageId, deck, tag)
    }

    //set image for front card
    let replyMessage;
    if(front !== null && frontImg !== null){
      const carousel = carouselImg(frontImg);
      replyMessage = [carousel, frontMessage]
    }else if(front !== null && frontImg == null){
      replyMessage = frontMessage;
    }else if(front == null && frontImg !== null){
      frontMessage = sendCard("ตอบคำถามจากรูปด้านบน", pageId, deck, tag);
      const carousel = carouselImg(frontImg);
      replyMessage = [carousel, frontMessage];
    }else{
      frontMessage = message("การ์ดผิดพลาด ไม่มีคำถาม");
      replyMessage = frontMessage
    }

    //push notify
    if (eventId !== null) {
      const response = await client.replyMessage(
        eventId,
        replyMessage
      )
    } else {
      const earlyMessage = message("เปิดการ์ดอัตโนมัติ")
      await client.broadcast(earlyMessage);
      setTimeout(function() {
        console.log('delay for 3 sec');
      }, 3000);
      const response = await client.broadcast(replyMessage);
      return response;
    }
  } else {
    console.log("no today card")
    if (eventId !== null) {
      let text;
      if (deck == "random") {
        text = message("ทวนการ์ดวันนี้ครบแล้ว🎉")
      } else {
        text = message("ทวนการ์ดในสำรับครบแล้ว🎉")
      }
      const response = await client.replyMessage(
        eventId,
        text
      )
    }
    return "no today card";
  }
}

//for quiz card
const checkCorrectAnswer = (userAnswer, back) => {
  //compare user answer with answer on the back of the card
  if(userAnswer == back){
    return "ตอบถูก👍🏻"
  }else{
    return `ตอบผิด❌ ข้อที่ถูกคือข้อ ${back}`
  }
}

//for quiz card
const sendChoice = (displayText, pageId, deck, tag) => {
  //quickreply for choice
  const quickReply = {
    type: "text",
    text: displayText,
    quickReply: {
      items: [],
    },
  };

  //add choice
  for(let i = 1; i<=5; i++){
    quickReply.quickReply.items.push({
      type: "action",
      action: {
        type: "postback",
        label: `ข้อที่ ${i}`,
        data: `{"pageId": "${pageId}", "input": "choice", "answer": "${i}", "deck": "${deck}", "tag": "${tag}"}`,
        displayText: `ข้อที่ ${i}`,
      },
    })
  }

  return quickReply;
}

app.get('/pushcard', async (req, res) => {
  const response = await pushcard();
  res.send(response);
})

app.get('/waking', async (req, res) => {
  const response = "Server has woken up...";
  console.log("Server has woken up...")
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

  //user send message
  if (event.type == "message") {
    switch (event.message.text) {
      case "open card":
        //get all decks
        const decks = await retriveDeck("deck");

        //user select decks
        const message = await sendDecks("เลือกหมวด", decks);
        const response = await client.replyMessage(
          event.replyToken,
          message
        );
        return response;
      default: break;
    }
  }

  //check for postback
  if (event.type == 'postback') {
    console.log(event.postback.data)
    //get postback data
    const data = JSON.parse(event.postback.data);
    const pageId = data.pageId;
    const input = data.input
    const deck = data.deck || null;
    const tag = data.tag || null;

    //push card when select deck
    if (data.selectDeck) {
      const deck = data.selectDeck;
      const tagArr = await retriveTag(deck)
      if(tagArr.length!==0){
        console.log("get tag");
        const message = sendTag("เลือกหมวดย่อย", deck, tagArr)
        const response = await client.replyMessage(
          event.replyToken,
          message
        );
        return response;
      }
      const response = await pushcard(deck, event.replyToken);
      return response;
    }

    //push card when select tag
    if (data.selectTag) {
      const deck = data.deck;
      const response = await pushcard(deck, event.replyToken, data.selectTag)
      return response;
    }

    if (input == "next") {
      //send new question
      const response = await pushcard(deck, event.replyToken, tag)
      console.log("send new question")
      return response;
    }

    if (input == "later") {
      return event;
    }

    if (input == "suspend") {
      //update notion status to suspend
      await updateSuspend(pageId);
      console.log("card is suspended")

      //send remain card
      await sendRemainCard(event, deck, tag);
      console.log("send remain card")
      return event;
    }

    //get notion card
    let getCard = await getCardfromPageId(pageId);
    const filterCard = getCard.filter(card => card.page_id == pageId)
    const card = filterCard[0] || {};
    const back = card.back || null;
    const backImg = card.back_image || null;

    if (input == "choice"){
      //send correct answer
      const correctAnswer = checkCorrectAnswer(data.answer, back);
      const replyMessage = sendBack(correctAnswer, card, deck, tag);
      
      const response = await client.replyMessage(
        event.replyToken,
        replyMessage
      );
      console.log("send correct quiz card")
      return event;
    }

    if (input == "back") {
      //send answer
      let replyMessage;
      if(back !== null && backImg !== null){
        const backMessage = sendBack(back, card, deck, tag);
        const carousel = carouselImg(backImg);
        replyMessage = [carousel, backMessage];
      }else if(back !== null && backImg == null){
        replyMessage = sendBack(back, card, deck, tag);
      }else if(back == null && backImg !== null){
        const backMessage = sendBack("คำตอบจากภาพ", card, deck, tag);
        const carousel = carouselImg(backImg);
        replyMessage = [carousel, backMessage];
      }else{
        replyMessage = message("การ์ดผิดพลาด ไม่มีคำตอบ");
      }

      const response = await client.replyMessage(
        event.replyToken,
        replyMessage
      );
      console.log("send back card")
    } else {
      //if user press good hard easy or again
      //set new interval
      const modifiedCard = setNewInterval(card, input);

      //update card status to notion
      await updateCard(modifiedCard)
      console.log("update Success");

      //send remain card
      await sendRemainCard(event, deck, tag);
    }
  }
  return event;
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})