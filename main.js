require("dotenv").config();
const {
    sendBack,
    sendCard,
    sendDecks,
    sendTag,
    sendContinue,
    lineMessage,
    carouselImg
} = require("./line-api");
const {
    getAllDecks,
    getTodayCard,
    randomCard,
    getAllTags,
    getTagsCard,
    retrievePage,
    getAllPropsContent,
    updateCardInterval,
    suspendCard,
    updateDeckProgression
} = require("./notion-api");
const {setCardInterval} = require("./card");
const line = require("@line/bot-sdk");
const app = require("express")();
const port = process.env.PORT || 3000;

//setting line
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

////////////////////////////////////////////////////
//functions which manipulate with event
////////////////////////////////////////////////////
const pushCard = async (event) => {
    const data = JSON.parse(event.postback.data);
    const {deck, tag, deck_id} = data;
    const replyToken = event.replyToken;
    let replyMessage;


    //pepared random card from all deck
    if(deck == "random"){
        //get today card
        const allDeck = await getAllDecks(process.env.FLASH_CARD_SETTING_DB_ID);
        const allDeckId = allDeck.map((thisDeck) => thisDeck.deck_id);

        let listOfTodayCard = [];
        await Promise.all(allDeckId.map(async (deckId) => {
            const card = await getTodayCard(deckId);
            listOfTodayCard.push(...card)
        }))

        //prepare front card
        if(listOfTodayCard.length !== 0){
            const card = randomCard(listOfTodayCard);
            const frontProps = await getAllPropsContent(card.card_id, ["front", "front image"])
            let cardFront = frontProps.front;
            const frontImage = frontProps["front image"];

            //check cloze card
            if(cardFront.match(/\?\?/g)) cardFront = cardFront.replace(/\?\?.*?\?\?/g,"___");

            const sendCardOptions = {
                displayText: cardFront,
                card_id: card.card_id,
                deck: "random",
                tag: "random"
            }

            //check front image
            if(frontImage.length!==0) {
                const carousel = carouselImg(frontImage);
                if(cardFront == "") {
                    sendCardOptions.displayText = "ตอบคำถามจากรูป"
                }
                const frontCardMessage = sendCard(sendCardOptions);
                replyMessage = [carousel, frontCardMessage];
            }else{
                replyMessage = sendCard(sendCardOptions);
            }
        }else{
            replyMessage = lineMessage("ทวนการ์ดวันนี้ครบแล้ว");
        }

        //push front card to user
        if(replyToken) {
            await client.replyMessage(
                replyToken,
                replyMessage
            );
        }else{
            await client.broadcast(replyMessage);
        }

        return event;
    }

    //prepared tag card in selected deck
    let listOfAllCards;
    if(tag == "random"){
        //get card in specific deck
        listOfAllCards = await getTodayCard(deck_id, tag);
        console.log("get random card in deck")
    }else{
        //get card which filter with tag
        listOfAllCards = await getTagsCard(deck_id, tag);
        console.log("get tag card");
    }

    if(listOfAllCards.length !== 0){
        //random and get front content of card
        const card = randomCard(listOfAllCards);
        const frontProps = await getAllPropsContent(card.card_id, ["front", "front image"])
        let cardFront = frontProps.front;
        const frontImage = frontProps["front image"];

        //check cloze card
        if(cardFront.match(/\?\?/g)) cardFront = cardFront.replace(/\?\?.*?\?\?/g,"___");

        //modified front card message
        const sendCardOptions = {
            displayText: cardFront,
            card_id: card.card_id,
            deck: deck,
            tag: tag
        }

        //check front image
        if(frontImage.length!==0) {
            const carousel = carouselImg(frontImage);
            if(cardFront == "") {
                sendCardOptions.displayText = "ตอบคำถามจากรูป"
            }
            const frontCardMessage = sendCard(sendCardOptions);
            replyMessage = [carousel, frontCardMessage];
        }else{
            replyMessage = sendCard(sendCardOptions);
        }
    }else{
        replyMessage = lineMessage("ทวนการ์ดวันนี้หมดแล้ว");
    }

    //push front card to user
    if(replyToken) {
        await client.replyMessage(
            replyToken,
            replyMessage
        );
    }else{
      await client.broadcast(replyMessage);
    }
    
    console.log("Front Card has been sent!");
    return event
}

const sendTagChoice = async (event) => {
    const data = JSON.parse(event.postback.data);
    const {deck} = data;

    //get deck id equal to deck name which user has selected.
    const allDeck = await getAllDecks(process.env.FLASH_CARD_SETTING_DB_ID);
    const selectDeckObj = allDeck.filter(
        (thisDeck) => thisDeck.deck_name == deck
    );
    const selectDeckId = selectDeckObj[0].deck_id;

    //get all tags
    const allTags = await getAllTags(selectDeckId);

    //Modified send tag message
    const sendTagOptions = {
        displayText: "เลือก Tags",
        deck: deck,
        deck_id: selectDeckId,
        tags: allTags
    }
    const tagMessage = sendTag(sendTagOptions);

    //Push tag choice to user
    await client.replyMessage(
        event.replyToken,
        tagMessage
    );
}

const sendDeckChoice = async (event) => {
    const decks = await getAllDecks(process.env.FLASH_CARD_SETTING_DB_ID);
    const decksName = decks.map((deck) => deck.deck_name);
    const message = await sendDecks("เลือกสำรับ", decksName);
    const response = await client.replyMessage(event.replyToken, message);
    return response;
}

const sendRemainCard = async (event) => {
    const data = JSON.parse(event.postback.data);
    const {card_id, deck, tag} = data

    let remain;
    if(deck == "random"){
        //get today card
        const allDeck = await getAllDecks(process.env.FLASH_CARD_SETTING_DB_ID);
        const allDeckId = allDeck.map((thisDeck) => thisDeck.deck_id);

        let listOfTodayCard = [];
        for(const i in allDeckId){
            const card = await getTodayCard(allDeckId[i])
            listOfTodayCard.push(...card)
        }
        
        remain = listOfTodayCard.length;
    }

    const cardData = await retrievePage(card_id);
    const deckId = cardData.parent.database_id;
    
    if(tag == "random"){
        const deckCards = await getTodayCard(deckId);
        remain =  deckCards.length;
    }else{
        const tagCards = await getTagsCard(deckId, tag);
        remain = tagCards.length;
    }

    //send continue message
    let sendContinueMessage;
    sendContinueMessage = sendContinue(remain, deck, deckId, tag);
    if(remain===0){
        sendContinueMessage = lineMessage("ทวนการ์ดวันนี้ครบแล้ว");
    }
    await client.replyMessage(
        event.replyToken,
        sendContinueMessage
    );

    return remain;
}

////////////////////////////////////////////////////
// event handler
////////////////////////////////////////////////////
async function handleEvent(event) {
    //check for message
    if (event.type == "message") {
        switch (event.message.text) {
            case "open card":
                await sendDeckChoice(event);
                return event;
            default: break;
        }
    }

    //check for postback
    if (event.type == "postback") {
        
        console.log(event.postback.data)

        const data = JSON.parse(event.postback.data);
        const {choice, card_id, deck, tag} = data;

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
                const backProps = await getAllPropsContent(card_id, ["front","back", "ease", "current", "date", "back image"]);
                const backImage = backProps["back image"];

                //check cloze card
                if(backProps.front.match(/\?\?/g)) {
                    const clozeOrigianal = backProps.front.replace(/\?\?/g,"")
                    backProps.back = clozeOrigianal;
                }

                //modified back card message
                let replayMessage;
                const sendBackOptions  = {
                    displayText: backProps.back,
                    card_id: card_id,
                    card_ease: backProps.ease,
                    card_current: backProps.current,
                    card_date: backProps.date,
                    deck: deck,
                    tag: tag
                }

                //check image card
                if(backImage.length!==0) {
                    const carousel = carouselImg(backImage);
                    if(backProps.back == "") {
                        sendBackOptions.displayText = "คำตอบจากรูป";
                    }
                    const backCardMessage = sendBack(sendBackOptions);
                    replayMessage = [carousel, backCardMessage];
                }else{
                    replayMessage = sendBack(sendBackOptions);
                }

                //Push message to user
                await client.replyMessage(
                    event.replyToken,
                    replayMessage
                );
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
                const defaultProps = await getAllPropsContent(card_id, ["ease", "current", "date"]);

                //set new interval
                const newIntervalCard = setCardInterval({
                    card_current: defaultProps.current,
                    card_ease: defaultProps.ease,
                    card_date: defaultProps.date}, choice
                );

                //update card property
                await updateCardInterval(card_id, newIntervalCard);
                console.log(`Card has been updated for ${choice} selection`);

                //send remain card to user
                const remain = await sendRemainCard(event);
                console.log("Remain card has sent!")

                //update deck progression
                const cardData = await retrievePage(card_id);
                const deckId = cardData.parent.database_id;
                await updateDeckProgression(deckId, remain);
                console.log("Update deck progression complete!")
                
            return event;
        }
    }

    return event;
}

////////////////////////////////////////////////////
//server
////////////////////////////////////////////////////

//webhook
app.post("/callback", line.middleware(config), (req, res) => {
    Promise.all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

//auto pushcard path
app.get('/pushcard', async (req, res) => {
    const event = {postback: {
        data: JSON.stringify({
            deck: "random",
            tag: "random",
        })
    }}
    const response = await pushCard(event);
    res.send(response);
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
