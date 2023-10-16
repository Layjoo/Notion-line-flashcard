require("dotenv").config();
const {
  sendBack,
  sendCard,
  sendTag,
  sendContinue,
  lineMessage,
  decksCarousel,
  processImages,
} = require("./line-api");
const {
  getAllDecks,
  getTodayCard,
  randomCard,
  getAllTags,
  getTagsCard,
  updateCardInterval,
  suspendCard,
  updateCurrentCard,
  getCurrentCardProps,
  getCardInfo,
  getDeckName,
} = require("./notion-api");
const { setCardInterval } = require("./card");
const line = require("@line/bot-sdk");
const app = require("express")();
const port = process.env.PORT || 3000;

//////////////////////// Update local variable ////////////////////////////
let allDecks;

const updateAllDecks = () => {
  getAllDecks(process.env.FLASH_CARD_SETTING_DB_ID).then((data) => {
    allDecks = data;
    console.log("All Decks updated successfully! ✅");
  });
};

updateAllDecks();

setInterval(updateAllDecks, 60 * 1000);

//////////////////////// Setting Line API ////////////////////////////
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

//////////////////////// Event function ////////////////////////////
const pushCard = async (event, postback = null) => {
  let deck
  let tag
  let deck_id

  if(!postback) {
    const data = JSON.parse(event.postback.data);
    deck = data.deck;
    tag = data.tag;
    deck_id = data.deck_id;
  }else{
    deck = postback.deck;
    tag = postback.tag;
    deck_id = postback.deck_id;
  }
    
  const replyToken = event.replyToken;
  let replyMessage;
  let cardId;

  //if user random card or server auto push card -> pepared random card from all deck
  if (deck === "random") {
    //get today card
    const allDeckId = allDecks.map((thisDeck) => thisDeck.deck_id);

    let listOfTodayCard = [];
    await Promise.all(
      allDeckId.map(async (deckId) => {
        const card = await getTodayCard(deckId);
        listOfTodayCard.push(...card);
      })
    );

    //prepare front card
    if (listOfTodayCard.length !== 0) {
      const card = randomCard(listOfTodayCard);
      cardId = card.card_id;

      const frontProps = await getCardInfo(card.card_id);
      let cardFront = frontProps.front;
      const frontImage = frontProps["front image"];

      //check cloze card
      if (cardFront.match(/\?\?/g))
        cardFront = cardFront.replace(/\?\?.*?\?\?/g, "___");

      const sendCardOptions = {
        displayText: cardFront,
        card_id: card.card_id,
        deck: "random",
        tag: "random",
      };

      //check front image
      if (frontImage.length !== 0) {
        const image = await processImages(frontImage);
        if (cardFront == "") {
          sendCardOptions.displayText = "ตอบคำถามจากรูป";
        }
        const frontCardMessage = sendCard(sendCardOptions);
        replyMessage = [...image, frontCardMessage];
      } else {
        replyMessage = sendCard(sendCardOptions);
      }
    } else {
      //if auto push card and no card left
      if (replyToken === "pushcard") return event;

      //if user push card and no card left
      replyMessage = lineMessage("ทวนการ์ดวันนี้ครบแล้ว");
    }

    //update current card status
    await updateCurrentCard(cardId, deck, tag);

    //push front card to user
    if (replyToken === "pushcard") {
      await client.broadcast(replyMessage);
    } else {
      await client.replyMessage(replyToken, replyMessage);
    }

    return event;
  }

  //if user selected deck -> prepared card from selected tag or random card in selected deck
  let listOfAllCards;
  if (tag === "random") {
    //prepared card from selected tag in deck
    listOfAllCards = await getTodayCard(deck_id, tag);
    console.log("get random card in deck");
  } else {
    //get card which filter with tag in deck
    listOfAllCards = await getTagsCard(deck_id, tag);
    console.log("Get tag card");
  }

  if (listOfAllCards.length !== 0) {
    //random and get front content of card
    const card = randomCard(listOfAllCards);
    cardId = card.card_id;
    //update current card status
    await updateCurrentCard(cardId, deck, tag, deck_id);

    const frontProps = await getCardInfo(card.card_id);
    let cardFront = frontProps.front;
    const frontImage = frontProps["front image"];

    //check cloze card
    if (cardFront.match(/\?\?/g))
      cardFront = cardFront.replace(/\?\?.*?\?\?/g, "___");

    //modified front card message
    const sendCardOptions = {
      displayText: cardFront,
      card_id: card.card_id,
      deck: deck,
      deck_id: deck_id,
      tag: tag,
    };

    //check front image
    if (frontImage.length !== 0) {
      const image = await processImages(frontImage);
      if (cardFront == "") {
        sendCardOptions.displayText = "ตอบคำถามจากรูป";
      }
      const frontCardMessage = sendCard(sendCardOptions);
      replyMessage = [...image, frontCardMessage];
    } else {
      replyMessage = sendCard(sendCardOptions);
    }
  } else {
    replyMessage = lineMessage("ทวนการ์ดวันนี้หมดแล้ว");
  }

  //push front card to user
  if (replyToken) {
    await client.replyMessage(replyToken, replyMessage);
  } else {
    await client.broadcast(replyMessage);
  }

  console.log("Front Card has been sent!");

  return event;
};

const sendTagChoice = async (event) => {
  const data = JSON.parse(event.postback.data);
  const { deck, deck_id } = data;

  //get all tags
  const allTags = await getAllTags(deck_id);

  //Modified send tag message
  const sendTagOptions = {
    displayText: "เลือก Tags",
    deck: deck,
    deck_id: deck_id,
    tags: allTags,
  };
  const tagMessage = sendTag(sendTagOptions);

  //Push tag choice to user
  await client.replyMessage(event.replyToken, tagMessage);
};

const sendCarouselDecks = async (event) => {
  const decksData = await Promise.all(
    allDecks.map(async (deck) => {
      const deckProps = await getDeckName(deck.page_deck);
      const data = {
        deck_name: deckProps["deck"],
        deck_id: deck.deck_id,
      };
      return data;
    })
  );
  const message = decksCarousel(decksData);
  const response = await client.replyMessage(event.replyToken, message);
  return response;
};

const sendRemainCard = async (
  event,
  deck = null,
  deck_id = null,
  tag = null
) => {
  if (deck === null && deck_id === null && tag === null) {
    const data = JSON.parse(event.postback.data);
    deck = data.deck;
    deck_id = data.deck_id;
    tag = data.tag;
  }

  let remain;
  if (deck == "random") {
    //get today card
    const allDeckId = allDecks.map((thisDeck) => thisDeck.deck_id);

    let listOfTodayCard = [];
    await Promise.all(
      allDeckId.map(async (deckId) => {
        const card = await getTodayCard(deckId);
        listOfTodayCard.push(...card);
      })
    );
    remain = listOfTodayCard.length;
  } else if (tag == "random") {
    const deckCards = await getTodayCard(deck_id);
    remain = deckCards.length;
  } else {
    const tagCards = await getTagsCard(deck_id, tag);
    remain = tagCards.length;
  }

  //send continue message
  let sendContinueMessage;
  sendContinueMessage = sendContinue(remain, deck, deck_id, tag);
  if (remain === 0) {
    sendContinueMessage = lineMessage("ทวนการ์ดวันนี้ครบแล้ว");
  }
  await client.replyMessage(event.replyToken, sendContinueMessage);

  return event;
};

//////////////////////// Event Handler ////////////////////////////
async function handleEvent(event) {
  const eventType = event.type;
  console.log(`New event ✨`);
  if (eventType === "message") {
    console.log(`Message: ${event.message.text}`);
  }
  if (eventType === "postback") {
    console.log(`Postback: ${JSON.parse(event.postback.data).choice}`);
  }

  switch (eventType) {
    case "follow":
      await followHandeler(event);
      break;
    case "message":
      await messageHandeler(event);
      break;
    case "postback":
      await postbackHandler(event);
      break;
    default:
      console.log(`Unsupported event type: ${eventType}`);
  }
}

//message event
const messageHandeler = async (event) => {
  let cardInfo;
  switch (event.message.text) {
    case "open card":
      await sendCarouselDecks(event);
      return event;
    case "ต่อไป": 
      cardInfo = await getCurrentCardProps();
      await pushCard(event, {deck: cardInfo.deck, tag: cardInfo.tag, deck_id: cardInfo.deck_id});
      return event;
    case "เฉลย":
      //get current card info
      cardInfo = await getCurrentCardProps();

      //get notion card content from card_id
      const backProps = await getCardInfo(cardInfo.card_id);
      const backImage = backProps["back image"];

      //check cloze card
      if (backProps.front.match(/\?\?/g)) {
        const clozeOrigianal = backProps.front.replace(/\?\?/g, "");
        backProps.back = clozeOrigianal;
      }

      //modified back card message
      let replayMessage;
      const sendBackOptions = {
        displayText: backProps.back,
        card_id: cardInfo.card_id,
        card_ease: backProps.ease,
        card_current: backProps.current,
        card_date: backProps.date,
        deck: cardInfo.deck,
        deck_id: cardInfo.deck_id,
        tag: cardInfo.tag,
      };

      //check image card
      if (backImage.length !== 0) {
        const image = await processImages(backImage);
        if (backProps.back == "") {
          sendBackOptions.displayText = "คำตอบจากรูป";
        }
        const backCardMessage = sendBack(sendBackOptions);
        replayMessage = [backCardMessage, ...image];
      } else {
        replayMessage = sendBack(sendBackOptions);
      }

      //Push message to user
      await client.replyMessage(event.replyToken, replayMessage);
      console.log("Back Card has been sent!");
      return event;
    default:
      //defalt for good hard easy again
      const choice = event.message.text;
      const choiceList = ["good", "hard", "easy", "again"];
      if (choiceList.includes(choice)) {
        const current = await getCurrentCardProps();
        const card = await getCardInfo(current.card_id);
        const card_state = {
          card_current: card.current,
          card_ease: card.ease,
          card_date: card.date,
        };

        //set new interval
        const newIntervalCard = setCardInterval(card_state, choice);

        //update card property
        await updateCardInterval(current.card_id, newIntervalCard);
        console.log(`Card has been updated for ${choice} selection`);

        //send remain card to user
        await sendRemainCard(event, current.deck, current.deck_id, current.tag);
        console.log("Remain card has sent!");

        return event;
      }
      break;
  }
};

//postback event
const postbackHandler = async (event) => {
  const data = JSON.parse(event.postback.data);
  const { choice, card_id, deck, deck_id, tag, card_state } = data;

  switch (choice) {
    case "selectedDeck":
      if (deck == "random") {
        await pushCard(event);
        return event;
      }
      await sendTagChoice(event);
      return event;
    case "selectedTag":
      await pushCard(event);
      return event;
    case "back":
      //get notion card content from card_id
      //get notion card content from card_id
      const backProps = await getCardInfo(card_id);
      const backImage = backProps["back image"];

      //check cloze card
      if (backProps.front.match(/\?\?/g)) {
        const clozeOrigianal = backProps.front.replace(/\?\?/g, "");
        backProps.back = clozeOrigianal;
      }

      //modified back card message
      let replayMessage;
      const sendBackOptions = {
        displayText: backProps.back,
        card_id: card_id,
        card_ease: backProps.ease,
        card_current: backProps.current,
        card_date: backProps.date,
        deck: deck,
        deck_id: deck_id,
        tag: tag,
      };

      //check image card
      if (backImage.length !== 0) {
        const image = await processImages(backImage);
        if (backProps.back == "") {
          sendBackOptions.displayText = "คำตอบจากรูป";
        }
        const backCardMessage = sendBack(sendBackOptions);
        replayMessage = [backCardMessage, ...image];
      } else {
        replayMessage = sendBack(sendBackOptions);
      }

      //Push message to user
      await client.replyMessage(event.replyToken, replayMessage);
      console.log("Back Card has been sent!");
      return event;
    case "next":
      //send next card
      await pushCard(event);
      return event;
    case "suspend":
      //update property to disable
      await suspendCard(card_id);
      //send remain card
      await sendRemainCard(event);
      return event;
    case "later":
      return event;
    default:
      //defalt for good hard easy again

      //set new interval
      const newIntervalCard = setCardInterval(card_state, choice);

      //update card property
      await updateCardInterval(card_id, newIntervalCard);
      console.log(`Card has been updated for ${choice} selection`);

      //send remain card to user
      await sendRemainCard(event);
      console.log("Remain card has sent!");

      return event;
  }
};

//////////////////////// Server ////////////////////////////
//webhook
app.post("/callback", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

//auto pushcard endpoint
app.get("/pushcard", async (req, res) => {
  const event = {
    postback: {
      data: JSON.stringify({
        deck: "random",
        tag: "random",
      }),
    },
    replyToken: "pushcard",
  };
  const response = await pushCard(event);
  res.send(response);
});

//waking server
app.get("/update_deck_progression", async (req, res) => {
  const response = "Server has woken up...";
  console.log("Server has woken up...");
  res.send(response);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
